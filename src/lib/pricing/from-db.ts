/**
 * Maps Supabase row shapes (supabase/migrations/20260819120000_init_schema.sql)
 * into the pure `ServiceVariantPricingConfig` the engine consumes.
 *
 * This is the only file in `src/lib/pricing` allowed to know about database
 * column names — `engine.ts` stays free of any persistence concerns.
 */

import type {
  PricingAddOnConfig,
  PricingModifierConfig,
  QuoteOnlyCondition,
  QuoteOnlyRuleConfig,
  ServiceVariantPricingConfig,
} from "./types";

export interface ServiceVariantRow {
  pricing_mode: "ranged" | "fixed";
  starting_price_cents: number;
  minimum_price_cents: number | null;
}

export interface PricingModifierRow {
  key: string;
  name: string;
  amount_cents: number;
  condition_question_key: string;
  condition_equals: string;
  is_active: boolean;
}

export interface PricingAddOnRow {
  key: string;
  name: string;
  amount_cents: number;
  is_active: boolean;
}

export interface PricingQuoteOnlyRuleRow {
  reason: string;
  conditions: unknown;
}

export interface QuestionRow {
  key: string;
  required_for_pricing: boolean;
  is_active: boolean;
}

/** Narrows the jsonb `conditions` column into typed, well-formed conditions; malformed entries are dropped rather than crashing the request. */
function parseConditions(raw: unknown): QuoteOnlyCondition[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is QuoteOnlyCondition =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as Record<string, unknown>).questionKey === "string" &&
      typeof (entry as Record<string, unknown>).equals === "string"
  );
}

/**
 * Builds the config the engine needs for one service variant, from its own
 * row plus the active modifiers/add-ons/quote-only-rules scoped to it and
 * the active questions scoped to its parent service.
 */
export function buildServiceVariantPricingConfig(params: {
  variant: ServiceVariantRow;
  modifiers: PricingModifierRow[];
  addOns: PricingAddOnRow[];
  quoteOnlyRules: PricingQuoteOnlyRuleRow[];
  questions: QuestionRow[];
}): ServiceVariantPricingConfig {
  const { variant, modifiers, addOns, quoteOnlyRules, questions } = params;

  const activeModifiers: PricingModifierConfig[] = modifiers
    .filter((m) => m.is_active)
    .map((m) => ({
      key: m.key,
      name: m.name,
      amountCents: m.amount_cents,
      conditionQuestionKey: m.condition_question_key,
      conditionEquals: m.condition_equals,
    }));

  const activeAddOns: PricingAddOnConfig[] = addOns
    .filter((a) => a.is_active)
    .map((a) => ({ key: a.key, name: a.name, amountCents: a.amount_cents }));

  const rules: QuoteOnlyRuleConfig[] = quoteOnlyRules.map((r) => ({
    reason: r.reason,
    conditions: parseConditions(r.conditions),
  }));

  const requiredAnswerKeys = questions
    .filter((q) => q.is_active && q.required_for_pricing)
    .map((q) => q.key);

  return {
    pricingMode: variant.pricing_mode,
    startingPriceCents: variant.starting_price_cents,
    minimumPriceCents: variant.minimum_price_cents,
    modifiers: activeModifiers,
    addOns: activeAddOns,
    quoteOnlyRules: rules,
    requiredAnswerKeys,
  };
}
