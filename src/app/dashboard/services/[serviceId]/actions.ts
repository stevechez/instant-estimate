"use server";

import { revalidatePath } from "next/cache";
import { getOwnedService, requireUser } from "@/lib/auth/dal";
import { parseDollarsToCents } from "@/lib/money";
import { UNIVERSAL_MODIFIERS } from "@/lib/plumbing-services";

export type PricingFormState = { status: "error"; message: string } | { status: "saved" } | undefined;

interface VariantPricingPayload {
  variant_id: string;
  starting_price_cents: number;
  minimum_price_cents: number | null;
  pricing_mode: "ranged" | "fixed";
  modifiers: {
    key: string;
    name: string;
    amount_cents: number;
    condition_question_key: string;
    condition_equals: string;
  }[];
  add_ons: { name: string; amount_cents: number }[];
}

export async function savePricing(
  serviceId: string,
  _prevState: PricingFormState,
  formData: FormData
): Promise<PricingFormState> {
  const ctx = await requireUser();
  const service = await getOwnedService(serviceId, ctx);
  if (!service) {
    return { status: "error", message: "Service not found." };
  }

  const { supabase } = ctx;

  const { data: variants, error: variantsError } = await supabase
    .from("service_variants")
    .select("id, key")
    .eq("service_id", service.id);

  if (variantsError) {
    return { status: "error", message: "Something went wrong. Try again." };
  }

  // Build one payload for the whole save; the actual writes happen in a
  // single save_service_pricing() RPC call so the save is all-or-nothing
  // (see supabase/migrations/20260819150000_save_service_pricing_rpc.sql —
  // per-variant REST calls in a loop had no transaction boundary). Add-on
  // keys are generated inside that function, not here, so it can
  // de-duplicate names that normalize to the same key before they ever hit
  // the unique constraint.
  const payload: VariantPricingPayload[] = (variants ?? []).map((variant) => {
    const priceCents = parseDollarsToCents(formData.get(`price__${variant.key}`));
    const minimumCents = parseDollarsToCents(formData.get(`minimum__${variant.key}`));
    const isFixed = formData.get(`fixed__${variant.key}`) === "on";

    const modifiers = UNIVERSAL_MODIFIERS.map((def) => {
      const amountCents = parseDollarsToCents(formData.get(`mod_${def.key}__${variant.key}`));
      return amountCents && amountCents > 0
        ? {
            key: def.key,
            name: def.label,
            amount_cents: amountCents,
            condition_question_key: def.conditionQuestionKey,
            condition_equals: def.conditionEquals,
          }
        : null;
    }).filter((modifier) => modifier !== null);

    const addOnNames = formData.getAll(`addon_name__${variant.key}`).map(String);
    const addOnPrices = formData.getAll(`addon_price__${variant.key}`).map(String);
    const addOns = addOnNames
      .map((name, index) => {
        const trimmedName = name.trim();
        const amountCents = parseDollarsToCents(addOnPrices[index]);
        if (!trimmedName || !amountCents || amountCents <= 0) return null;
        return { name: trimmedName, amount_cents: amountCents };
      })
      .filter((addOn) => addOn !== null);

    return {
      variant_id: variant.id,
      starting_price_cents: priceCents ?? 0,
      minimum_price_cents: minimumCents,
      pricing_mode: isFixed ? ("fixed" as const) : ("ranged" as const),
      modifiers,
      add_ons: addOns,
    };
  });

  const { error } = await supabase.rpc("save_service_pricing", {
    p_service_id: service.id,
    p_variants: payload,
  });

  if (error) {
    return { status: "error", message: "Something went wrong saving your pricing. Try again." };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  return { status: "saved" };
}

export type ActivationFormState = { status: "error"; message: string } | undefined;

export async function activateService(
  serviceId: string,
  _prevState: ActivationFormState
): Promise<ActivationFormState> {
  const ctx = await requireUser();
  const service = await getOwnedService(serviceId, ctx);
  if (!service) {
    return { status: "error", message: "Service not found." };
  }

  const { supabase } = ctx;

  const { count, error: countError } = await supabase
    .from("service_variants")
    .select("id", { count: "exact", head: true })
    .eq("service_id", service.id)
    .gt("starting_price_cents", 0);

  if (countError) {
    return { status: "error", message: "Something went wrong. Try again." };
  }
  if (!count || count === 0) {
    return { status: "error", message: "Set a starting price before activating this service." };
  }

  const { error } = await supabase.from("services").update({ is_active: true }).eq("id", service.id);
  if (error) {
    return { status: "error", message: "Something went wrong activating this service. Try again." };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  revalidatePath("/dashboard");
}

export type DeactivationFormState = { status: "error"; message: string } | undefined;

export async function deactivateService(
  serviceId: string,
  _prevState: DeactivationFormState
): Promise<DeactivationFormState> {
  const ctx = await requireUser();
  const service = await getOwnedService(serviceId, ctx);
  if (!service) {
    return { status: "error", message: "Service not found." };
  }

  const { error } = await ctx.supabase.from("services").update({ is_active: false }).eq("id", service.id);
  if (error) {
    return { status: "error", message: "Something went wrong deactivating this service. Try again." };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  revalidatePath("/dashboard");
}
