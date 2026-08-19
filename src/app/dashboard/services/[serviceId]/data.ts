import "server-only";

import { requireUser, getOwnedService } from "@/lib/auth/dal";
import { buildServiceVariantPricingConfig } from "@/lib/pricing/from-db";
import { calculate } from "@/lib/pricing/engine";
import type { PricingResult } from "@/lib/pricing/types";

export interface VariantModifier {
  key: string;
  name: string;
  amount_cents: number;
  condition_question_key: string;
  condition_equals: string;
}

export interface VariantAddOn {
  key: string;
  name: string;
  amount_cents: number;
}

export interface VariantWithPricing {
  id: string;
  key: string;
  name: string;
  pricing_mode: "ranged" | "fixed";
  starting_price_cents: number;
  minimum_price_cents: number | null;
  is_active: boolean;
  /** Bumped by the DB on every successful save (service_variants has an updated_at trigger). Used to key VariantCard so a save remounts it with fresh server truth instead of stale uncontrolled-input state. */
  updated_at: string;
  modifiers: VariantModifier[];
  add_ons: VariantAddOn[];
  /** Example estimate at $0 modifiers/no add-ons, and again with every universal modifier + add-on applied. Null when unpriced. */
  examples: { normal: PricingResult; everything: PricingResult } | null;
}

export async function loadServicePricingData(serviceId: string) {
  const ctx = await requireUser();
  const service = await getOwnedService(serviceId, ctx);
  if (!service) return null;

  const { supabase } = ctx;

  const { data: variantRows, error: variantsError } = await supabase
    .from("service_variants")
    .select("id, key, name, pricing_mode, starting_price_cents, minimum_price_cents, is_active, updated_at")
    .eq("service_id", service.id)
    .order("sort_order");

  if (variantsError) {
    throw new Error(`Failed to load variants: ${variantsError.message}`);
  }

  const variantIds = (variantRows ?? []).map((v) => v.id);

  const [{ data: modifierRows, error: modifiersError }, { data: addOnRows, error: addOnsError }] =
    await Promise.all([
      supabase
        .from("pricing_modifiers")
        .select("service_variant_id, key, name, amount_cents, condition_question_key, condition_equals")
        .in("service_variant_id", variantIds.length > 0 ? variantIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("pricing_add_ons")
        .select("service_variant_id, key, name, amount_cents")
        .in("service_variant_id", variantIds.length > 0 ? variantIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);

  if (modifiersError) throw new Error(`Failed to load modifiers: ${modifiersError.message}`);
  if (addOnsError) throw new Error(`Failed to load add-ons: ${addOnsError.message}`);

  const variants: VariantWithPricing[] = (variantRows ?? []).map((variant) => {
    const modifiers = (modifierRows ?? []).filter((m) => m.service_variant_id === variant.id);
    const addOns = (addOnRows ?? []).filter((a) => a.service_variant_id === variant.id);

    let examples: VariantWithPricing["examples"] = null;
    if (variant.starting_price_cents > 0) {
      const config = buildServiceVariantPricingConfig({
        variant,
        modifiers: modifiers.map((m) => ({ ...m, is_active: true })),
        addOns: addOns.map((a) => ({ ...a, is_active: true })),
        quoteOnlyRules: [],
        questions: [],
      });

      examples = {
        normal: calculate({ variant: config, answers: {}, selectedAddOnKeys: [] }),
        everything: calculate({
          variant: config,
          answers: { urgency: "emergency", after_hours: true, weekend: true },
          selectedAddOnKeys: addOns.map((a) => a.key),
        }),
      };
    }

    return { ...variant, modifiers, add_ons: addOns, examples };
  });

  return { service, variants };
}
