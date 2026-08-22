"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { classifyServiceFromDescription } from "@/lib/openai/classify-service";
import { buildServiceVariantPricingConfig } from "@/lib/pricing/from-db";
import { calculate } from "@/lib/pricing/engine";
import { formatMoney } from "@/lib/pricing/format";
import type { PricingResult } from "@/lib/pricing/types";
import { sendLeadNotification } from "@/lib/email/send-lead-notification";
import { isTwilioOptOutError, sendLeadSms } from "@/lib/sms/send-lead-sms";
import { normalizePhoneToE164 } from "@/lib/phone";
import { uploadEstimatePhotos } from "@/lib/estimate-photos/upload";
import { checkRateLimit, checkRateLimitForKey } from "@/lib/rate-limit/check";
import { RATE_LIMITS, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit/limits";
import { sanitizeAddOnKeys, withinLimit } from "@/lib/input-limits";
import {
  isBusinessActive,
  loadActiveServicesForBusiness,
  loadActiveVariantOptions,
  loadVariantForEstimate,
  type VariantForEstimate,
} from "./data";

export type ClassifyResult =
  | { status: "matched"; service: { id: string; key: string; name: string } }
  | { status: "unmatched" }
  | { status: "rate_limited"; message: string };

/** AI interprets the homeowner's description; it never decides pricing (see classify-service.ts). */
export async function classifyDescription(businessId: string, description: string): Promise<ClassifyResult> {
  const trimmed = description.trim();
  if (trimmed.length < 3) {
    return { status: "unmatched" };
  }

  // Bound before the Anthropic call, not after — this is the one public
  // input with a direct per-request cost attached to its size.
  if (!withinLimit(trimmed, "description")) {
    return { status: "unmatched" };
  }

  const allowed = await checkRateLimit("classify", RATE_LIMITS.classify.windowSeconds, RATE_LIMITS.classify.limit);
  if (!allowed) {
    return { status: "rate_limited", message: RATE_LIMIT_MESSAGE };
  }

  if (!(await isBusinessActive(businessId))) return { status: "unmatched" };

  const services = await loadActiveServicesForBusiness(businessId);
  if (services.length === 0) return { status: "unmatched" };

  const { serviceKey } = await classifyServiceFromDescription(
    trimmed,
    services.map((s) => ({ key: s.key, name: s.name }))
  );

  if (!serviceKey) return { status: "unmatched" };

  const matched = services.find((s) => s.key === serviceKey);
  if (!matched) return { status: "unmatched" };

  return { status: "matched", service: matched };
}

export async function getVariantOptions(
  businessId: string,
  serviceId: string
): Promise<{ variants: VariantForEstimate[] }> {
  if (!(await isBusinessActive(businessId))) return { variants: [] };

  const options = await loadActiveVariantOptions(businessId, serviceId);
  const variants = await Promise.all(
    options.map((v) => loadVariantForEstimate(businessId, serviceId, v.id))
  );
  return { variants: variants.filter((v): v is VariantForEstimate => v !== null) };
}

export interface SubmitEstimateInput {
  businessId: string;
  serviceId: string;
  variantId: string;
  description: string;
  aiMatchedServiceKey: string | null;
  answers: { urgency?: "normal" | "emergency"; after_hours?: boolean; weekend?: boolean };
  selectedAddOnKeys: string[];
}

export type SubmitEstimateResult =
  | { status: "ok"; estimateId: string; shareToken: string; result: PricingResult }
  | { status: "error"; message: string };

export async function submitEstimate(input: SubmitEstimateInput): Promise<SubmitEstimateResult> {
  const allowed = await checkRateLimit(
    "submit-estimate",
    RATE_LIMITS.submitEstimate.windowSeconds,
    RATE_LIMITS.submitEstimate.limit
  );
  if (!allowed) {
    return { status: "error", message: RATE_LIMIT_MESSAGE };
  }

  if (!withinLimit(input.description, "description")) {
    return { status: "error", message: "That description is too long. Please shorten it and try again." };
  }
  // The engine already ignores unknown add-on keys; this bounds the work it
  // does looking them up when the caller isn't the real widget.
  const selectedAddOnKeys = sanitizeAddOnKeys(input.selectedAddOnKeys);

  if (!(await isBusinessActive(input.businessId))) {
    return { status: "error", message: "That service is no longer available." };
  }

  const variant = await loadVariantForEstimate(input.businessId, input.serviceId, input.variantId);
  if (!variant) {
    return { status: "error", message: "That service is no longer available." };
  }

  const config = buildServiceVariantPricingConfig({
    variant: {
      pricing_mode: variant.pricing_mode,
      starting_price_cents: variant.starting_price_cents,
      minimum_price_cents: variant.minimum_price_cents,
    },
    modifiers: variant.modifiers.map((m) => ({ ...m, is_active: true })),
    addOns: variant.add_ons.map((a) => ({ ...a, is_active: true })),
    quoteOnlyRules: [],
    questions: [],
  });

  const result = calculate({
    variant: config,
    answers: input.answers,
    selectedAddOnKeys,
  });

  const supabase = createAdminClient();
  const { data: inserted, error } = await supabase
    .from("estimates")
    .insert({
      business_id: input.businessId,
      service_id: input.serviceId,
      service_variant_id: input.variantId,
      homeowner_description: input.description,
      answers: input.answers,
      selected_add_on_keys: selectedAddOnKeys,
      status: result.status,
      low_price_cents: result.status === "estimated" ? result.lowCents : null,
      high_price_cents: result.status === "estimated" ? result.highCents : null,
      fixed_price_cents: result.status === "fixed" ? result.priceCents : null,
      breakdown: result.status === "quote_required" ? null : result.breakdown,
      refusal_reason: result.status === "quote_required" ? result.reason : null,
      ai_classification: { matched_service_key: input.aiMatchedServiceKey },
      urgency: input.answers.urgency ?? null,
    })
    .select("id, share_token")
    .single();

  if (error || !inserted) {
    return { status: "error", message: "Something went wrong calculating your estimate. Please try again." };
  }

  return { status: "ok", estimateId: inserted.id, shareToken: inserted.share_token, result };
}

/**
 * The AI-classification failure path (PRODUCT_SPEC.md Section 15): the
 * description didn't confidently match any of the business's services, so
 * there's no service/variant to price against at all. This is upstream of
 * the pricing engine's own quote_required reasons (PRICING_ENGINE_SPEC.md
 * Section 11) — a distinct, plain-text refusal_reason rather than the
 * engine's typed union, since the engine was never invoked.
 */
export async function submitUnmatchedEstimate(
  businessId: string,
  description: string
): Promise<SubmitEstimateResult> {
  const allowed = await checkRateLimit(
    "submit-estimate",
    RATE_LIMITS.submitEstimate.windowSeconds,
    RATE_LIMITS.submitEstimate.limit
  );
  if (!allowed) {
    return { status: "error", message: RATE_LIMIT_MESSAGE };
  }

  if (!withinLimit(description, "description")) {
    return { status: "error", message: "That description is too long. Please shorten it and try again." };
  }

  if (!(await isBusinessActive(businessId))) {
    return { status: "error", message: "That service is no longer available." };
  }

  const supabase = createAdminClient();
  const { data: inserted, error } = await supabase
    .from("estimates")
    .insert({
      business_id: businessId,
      homeowner_description: description,
      answers: {},
      selected_add_on_keys: [],
      status: "quote_required",
      refusal_reason: "ai_could_not_classify",
      ai_classification: { matched_service_key: null },
    })
    .select("id, share_token")
    .single();

  if (error || !inserted) {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  return {
    status: "ok",
    estimateId: inserted.id,
    shareToken: inserted.share_token,
    result: { status: "quote_required", reason: "not_configured" },
  };
}

export interface SubmitLeadInput {
  estimateId: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  serviceAddress?: string;
  preferredContactMethod?: string;
  preferredServiceTiming?: string;
  /** Up to 3 homeowner-uploaded photos (PRODUCT_SPEC.md Section 10) — best-effort, see uploadEstimatePhotos. */
  photos?: File[];
}

export type SubmitLeadResult = { status: "ok" } | { status: "error"; message: string };

function formatStoredEstimateLine(estimate: {
  status: string;
  low_price_cents: number | null;
  high_price_cents: number | null;
  fixed_price_cents: number | null;
}): string {
  if (estimate.status === "estimated" && estimate.low_price_cents !== null && estimate.high_price_cents !== null) {
    return `${formatMoney(estimate.low_price_cents)}–${formatMoney(estimate.high_price_cents)}`;
  }
  if (estimate.status === "fixed" && estimate.fixed_price_cents !== null) {
    return formatMoney(estimate.fixed_price_cents);
  }
  return "Quote required";
}

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  const allowed = await checkRateLimit(
    "submit-lead",
    RATE_LIMITS.submitLead.windowSeconds,
    RATE_LIMITS.submitLead.limit
  );
  if (!allowed) {
    return { status: "error", message: RATE_LIMIT_MESSAGE };
  }

  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 1 || phone.length < 7) {
    return { status: "error", message: "Enter your name and a valid phone number." };
  }

  // Upper bounds too: these actions are reachable by any caller, not just
  // the widget form, and every one of these lands in an unbounded text
  // column that a contractor then reads in their dashboard and email.
  const tooLong =
    !withinLimit(name, "name") ||
    !withinLimit(phone, "phone") ||
    !withinLimit(input.email?.trim(), "email") ||
    !withinLimit(input.serviceAddress?.trim(), "serviceAddress") ||
    !withinLimit(input.preferredContactMethod?.trim(), "preferredContactMethod") ||
    !withinLimit(input.preferredServiceTiming?.trim(), "preferredServiceTiming");
  if (tooLong) {
    return { status: "error", message: "One of those fields is too long. Please shorten it and try again." };
  }

  if (!(await isBusinessActive(input.businessId))) {
    return { status: "error", message: "This business isn't accepting requests right now." };
  }

  // Second, independent ceiling keyed on the target business rather than the
  // caller — see RATE_LIMITS.leadsPerBusiness. Protects the contractor from a
  // distributed flood even where per-IP identity can't be trusted.
  const businessAllowed = await checkRateLimitForKey(
    `lead-business:${input.businessId}`,
    RATE_LIMITS.leadsPerBusiness.windowSeconds,
    RATE_LIMITS.leadsPerBusiness.limit
  );
  if (!businessAllowed) {
    return { status: "error", message: "This business isn't accepting requests right now." };
  }

  const supabase = createAdminClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select(
      "id, status, low_price_cents, high_price_cents, fixed_price_cents, urgency, homeowner_description, service_id, services(name)"
    )
    .eq("id", input.estimateId)
    .eq("business_id", input.businessId)
    .maybeSingle();

  if (!estimate) {
    return { status: "error", message: "We couldn't find that estimate. Please start over." };
  }

  if (input.serviceAddress?.trim()) {
    await supabase
      .from("estimates")
      .update({ service_address: input.serviceAddress.trim() })
      .eq("id", input.estimateId);
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: input.businessId,
      estimate_id: input.estimateId,
      name,
      phone,
      email: input.email?.trim() || null,
      preferred_contact_method: input.preferredContactMethod?.trim() || null,
      preferred_service_timing: input.preferredServiceTiming?.trim() || null,
      status: "new",
    })
    .select("id")
    .single();

  // 23505 = unique_violation on leads_one_per_estimate_idx: a lead for this
  // estimate already exists. That's a resubmission (refresh, second tab,
  // retry after a slow response), not a failure — the homeowner's request
  // *was* received. Report success and return without notifying again, so
  // the contractor doesn't get a duplicate email and SMS for one job.
  if (error?.code === "23505") {
    return { status: "ok" };
  }

  if (error || !lead) {
    return { status: "error", message: "Something went wrong submitting your request. Please try again." };
  }

  // Best-effort, same as the notification channels below: the lead above is
  // already saved and is the source of truth. Photos are supporting
  // evidence (PRODUCT_SPEC.md Section 10), not required for a valid lead.
  if (input.photos && input.photos.length > 0) {
    try {
      await uploadEstimatePhotos(supabase, input.estimateId, input.photos);
    } catch (photoError) {
      console.error("Failed to upload estimate photos:", photoError);
    }
  }

  // Best-effort, both channels: the lead above is already saved and is the
  // source of truth. A notification failure — email or SMS — must never
  // make the homeowner's submission look like it failed (PRODUCT_SPEC.md
  // Section 19 requires email; SMS is additive, not a replacement, and each
  // channel is isolated so one failing never blocks the other).
  const { data: business } = await supabase
    .from("businesses")
    .select("owner_id, notification_phone")
    .eq("id", input.businessId)
    .maybeSingle();

  // services(name) comes back as an object via the FK join; Supabase's
  // generated types don't know the relationship's cardinality here, hence
  // the cast rather than a false non-null assumption.
  const serviceName = (estimate as unknown as { services: { name: string } | null }).services?.name ?? null;
  const estimateLine = formatStoredEstimateLine(estimate);
  let notified = false;

  if (business) {
    try {
      const { data: ownerUser } = await supabase.auth.admin.getUserById(business.owner_id);
      const contractorEmail = ownerUser.user?.email;

      if (contractorEmail) {
        await sendLeadNotification({
          contractorEmail,
          leadId: lead.id,
          homeownerName: name,
          phone,
          email: input.email?.trim() || null,
          serviceName,
          estimateLine,
          urgency: estimate.urgency,
          description: estimate.homeowner_description,
        });
        notified = true;
      }
    } catch (notificationError) {
      console.error("Failed to send lead notification email:", notificationError);
    }

    const normalizedPhone = business.notification_phone
      ? normalizePhoneToE164(business.notification_phone)
      : null;

    if (normalizedPhone) {
      try {
        await sendLeadSms({
          toPhone: normalizedPhone,
          leadId: lead.id,
          homeownerName: name,
          serviceName,
          estimateLine,
        });
        notified = true;
      } catch (smsError) {
        // Twilio blocks messages to a number that replied STOP and rejects
        // the send with 21610. Record that so the contractor's settings page
        // can stop implying texts are being delivered. This mirrors Twilio's
        // state rather than maintaining our own: Twilio is still the
        // authority on who is subscribed (see the column comment in
        // supabase/migrations/20260820170000_retention_and_sms_optout.sql).
        if (isTwilioOptOutError(smsError)) {
          await supabase
            .from("businesses")
            .update({ sms_opted_out_at: new Date().toISOString() })
            .eq("id", input.businessId);
        }
        console.error("Failed to send lead notification SMS:", smsError);
      }
    }
  }

  if (notified) {
    await supabase.from("leads").update({ notified_at: new Date().toISOString() }).eq("id", lead.id);
  }

  return { status: "ok" };
}
