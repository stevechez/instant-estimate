"use server";

import { revalidatePath } from "next/cache";
import { getOwnedService, requireUser } from "@/lib/auth/dal";
import { parseDollarsToCents } from "@/lib/money";
import { UNIVERSAL_MODIFIERS } from "@/lib/plumbing-services";

export type PricingFormState = { status: "error"; message: string } | { status: "saved" } | undefined;

export async function savePricing(
  serviceId: string,
  _prevState: PricingFormState,
  formData: FormData
): Promise<PricingFormState> {
  const service = await getOwnedService(serviceId);
  if (!service) {
    return { status: "error", message: "Service not found." };
  }

  const { supabase } = await requireUser();

  const { data: variants, error: variantsError } = await supabase
    .from("service_variants")
    .select("id, key")
    .eq("service_id", service.id);

  if (variantsError) {
    return { status: "error", message: "Something went wrong. Try again." };
  }

  for (const variant of variants ?? []) {
    const priceCents = parseDollarsToCents(formData.get(`price__${variant.key}`));
    const minimumCents = parseDollarsToCents(formData.get(`minimum__${variant.key}`));
    const isFixed = formData.get(`fixed__${variant.key}`) === "on";

    const { error: updateError } = await supabase
      .from("service_variants")
      .update({
        starting_price_cents: priceCents ?? 0,
        minimum_price_cents: minimumCents,
        pricing_mode: isFixed ? "fixed" : "ranged",
        // A variant with no price yet can't be estimated from, so it isn't
        // eligible to be picked at estimate time even if the service overall
        // is active (e.g. only "Replacement" is priced so far).
        is_active: (priceCents ?? 0) > 0,
      })
      .eq("id", variant.id);

    if (updateError) {
      return { status: "error", message: "Something went wrong saving your pricing. Try again." };
    }

    // Universal modifiers: replace-all is simpler and safer to reason about
    // here than diffing, and this list is short (3 fixed dimensions).
    const { error: deleteModifiersError } = await supabase
      .from("pricing_modifiers")
      .delete()
      .eq("service_variant_id", variant.id);
    if (deleteModifiersError) {
      return { status: "error", message: "Something went wrong saving your pricing. Try again." };
    }

    const modifierRows = UNIVERSAL_MODIFIERS.map((def) => {
      const amountCents = parseDollarsToCents(formData.get(`mod_${def.key}__${variant.key}`));
      return amountCents && amountCents > 0
        ? {
            service_variant_id: variant.id,
            key: def.key,
            name: def.label,
            amount_cents: amountCents,
            condition_question_key: def.conditionQuestionKey,
            condition_equals: def.conditionEquals,
          }
        : null;
    }).filter((row) => row !== null);

    if (modifierRows.length > 0) {
      const { error: insertModifiersError } = await supabase.from("pricing_modifiers").insert(modifierRows);
      if (insertModifiersError) {
        return { status: "error", message: "Something went wrong saving your pricing. Try again." };
      }
    }

    // Add-ons: same replace-all approach.
    const { error: deleteAddOnsError } = await supabase
      .from("pricing_add_ons")
      .delete()
      .eq("service_variant_id", variant.id);
    if (deleteAddOnsError) {
      return { status: "error", message: "Something went wrong saving your pricing. Try again." };
    }

    const addOnNames = formData.getAll(`addon_name__${variant.key}`).map(String);
    const addOnPrices = formData.getAll(`addon_price__${variant.key}`).map(String);
    const addOnRows = addOnNames
      .map((name, index) => {
        const trimmedName = name.trim();
        const amountCents = parseDollarsToCents(addOnPrices[index]);
        if (!trimmedName || !amountCents || amountCents <= 0) return null;
        return {
          service_variant_id: variant.id,
          key: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `addon_${index}`,
          name: trimmedName,
          amount_cents: amountCents,
        };
      })
      .filter((row) => row !== null);

    if (addOnRows.length > 0) {
      const { error: insertAddOnsError } = await supabase.from("pricing_add_ons").insert(addOnRows);
      if (insertAddOnsError) {
        return { status: "error", message: "Something went wrong saving your pricing. Try again." };
      }
    }
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  return { status: "saved" };
}

export type ActivationFormState = { status: "error"; message: string } | undefined;

export async function activateService(
  serviceId: string,
  _prevState: ActivationFormState
): Promise<ActivationFormState> {
  const service = await getOwnedService(serviceId);
  if (!service) {
    return { status: "error", message: "Service not found." };
  }

  const { supabase } = await requireUser();

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

export async function deactivateService(serviceId: string): Promise<void> {
  const service = await getOwnedService(serviceId);
  if (!service) return;

  const { supabase } = await requireUser();
  await supabase.from("services").update({ is_active: false }).eq("id", service.id);

  revalidatePath(`/dashboard/services/${serviceId}`);
  revalidatePath("/dashboard");
}
