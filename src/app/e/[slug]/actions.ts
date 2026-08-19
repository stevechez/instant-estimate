"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { classifyServiceFromDescription } from "@/lib/anthropic/classify-service";
import { buildServiceVariantPricingConfig } from "@/lib/pricing/from-db";
import { calculate } from "@/lib/pricing/engine";
import { formatMoney } from "@/lib/pricing/format";
import type { PricingResult } from "@/lib/pricing/types";
import { sendLeadNotification } from "@/lib/email/send-lead-notification";
import {
  loadActiveServicesForBusiness,
  loadActiveVariantOptions,
  loadVariantForEstimate,
  type VariantForEstimate,
} from "./data";

export type ClassifyResult =
  | { status: "matched"; service: { id: string; key: string; name: string } }
  | { status: "unmatched" };

/** AI interprets the homeowner's description; it never decides pricing (see classify-service.ts). */
export async function classifyDescription(businessId: string, description: string): Promise<ClassifyResult> {
  const trimmed = description.trim();
  if (trimmed.length < 3) {
    return { status: "unmatched" };
  }

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
    selectedAddOnKeys: input.selectedAddOnKeys,
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
      selected_add_on_keys: input.selectedAddOnKeys,
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
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 1 || phone.length < 7) {
    return { status: "error", message: "Enter your name and a valid phone number." };
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

  if (error || !lead) {
    return { status: "error", message: "Something went wrong submitting your request. Please try again." };
  }

  // Best-effort: the lead above is already saved and is the source of
  // truth. A notification failure must never make the homeowner's
  // submission look like it failed (PRODUCT_SPEC.md Section 19 requires the
  // notification, but the lead itself is what actually matters).
  try {
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", input.businessId)
      .single();

    if (business) {
      const { data: ownerUser } = await supabase.auth.admin.getUserById(business.owner_id);
      const contractorEmail = ownerUser.user?.email;

      if (contractorEmail) {
        // services(name) comes back as an object via the FK join; Supabase's
        // generated types don't know the relationship's cardinality here,
        // hence the cast rather than a false non-null assumption.
        const serviceName = (estimate as unknown as { services: { name: string } | null }).services?.name ?? null;

        await sendLeadNotification({
          contractorEmail,
          leadId: lead.id,
          homeownerName: name,
          phone,
          email: input.email?.trim() || null,
          serviceName,
          estimateLine: formatStoredEstimateLine(estimate),
          urgency: estimate.urgency,
          description: estimate.homeowner_description,
        });

        await supabase.from("leads").update({ notified_at: new Date().toISOString() }).eq("id", lead.id);
      }
    }
  } catch (notificationError) {
    console.error("Failed to send lead notification email:", notificationError);
  }

  return { status: "ok" };
}
