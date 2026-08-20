/**
 * The pricing engine.
 *
 * Implements docs/PRICING_ENGINE_SPEC.md end to end: `calculate()` is a pure
 * function of its arguments — no I/O, no AI model calls, no randomness, no
 * wall-clock dependence. Given the same `PricingInput` it always returns the
 * same `PricingResult`.
 *
 * This module must not import from Supabase, Next.js, or any AI client.
 * Mapping database rows into `PricingInput` belongs in `from-db.ts`.
 */

import type {
  PricingAnswers,
  PricingBreakdownLine,
  PricingInput,
  PricingResult,
  QuoteOnlyCondition,
} from "./types";

/** Section 4: default spread applied to a variant's starting price to build a base range. */
const DEFAULT_SPREAD = 0.15;

/** Section 9: bounds are rounded outward to the nearest $25. */
const ROUND_TO_CENTS = 2500;

function answerEquals(answers: PricingAnswers, condition: QuoteOnlyCondition | { questionKey: string; equals: string }): boolean {
  const value = answers[condition.questionKey];
  if (value === null || value === undefined) return false;
  return String(value) === condition.equals;
}

function roundLowCents(cents: number): number {
  return Math.floor(cents / ROUND_TO_CENTS) * ROUND_TO_CENTS;
}

function roundHighCents(cents: number): number {
  return Math.ceil(cents / ROUND_TO_CENTS) * ROUND_TO_CENTS;
}

export function calculate(input: PricingInput): PricingResult {
  const { variant, answers, selectedAddOnKeys } = input;

  // Section 11.1 — no active pricing configuration for this service/variant.
  if (!variant) {
    return { status: "quote_required", reason: "not_configured" };
  }

  // Section 11.2 — required answers must be present before pricing proceeds.
  const missingAnswerKeys = variant.requiredAnswerKeys.filter((key) => {
    const value = answers[key];
    return value === null || value === undefined || value === "";
  });
  if (missingAnswerKeys.length > 0) {
    return { status: "quote_required", reason: "missing_required_input", missingAnswerKeys };
  }

  // Section 11.3 — contractor-flagged quote-only combinations short-circuit pricing.
  const triggeredRule = variant.quoteOnlyRules.find(
    (rule) => rule.conditions.length > 0 && rule.conditions.every((condition) => answerEquals(answers, condition))
  );
  if (triggeredRule) {
    return { status: "quote_required", reason: "quote_only_rule", ruleReason: triggeredRule.reason };
  }

  // Section 5 — sum applicable flat-dollar modifiers (order-independent, all non-negative).
  const activeModifiers = variant.modifiers.filter((modifier) =>
    answerEquals(answers, { questionKey: modifier.conditionQuestionKey, equals: modifier.conditionEquals })
  );
  const modifierBreakdown: PricingBreakdownLine[] = activeModifiers
    .filter((modifier) => modifier.amountCents !== 0)
    .map((modifier) => ({ key: modifier.key, label: modifier.name, amountCents: modifier.amountCents }));
  const modifierTotalCents = activeModifiers.reduce((sum, modifier) => sum + modifier.amountCents, 0);

  // Section 6 — sum selected flat-dollar add-ons.
  const selectedAddOns = variant.addOns.filter((addOn) => selectedAddOnKeys.includes(addOn.key));
  const addOnBreakdown: PricingBreakdownLine[] = selectedAddOns
    .filter((addOn) => addOn.amountCents !== 0)
    .map((addOn) => ({ key: addOn.key, label: addOn.name, amountCents: addOn.amountCents }));
  const addOnTotalCents = selectedAddOns.reduce((sum, addOn) => sum + addOn.amountCents, 0);

  const surchargeCents = modifierTotalCents + addOnTotalCents;
  const breakdown = [...modifierBreakdown, ...addOnBreakdown];

  if (variant.pricingMode === "fixed") {
    // Section 10 — fixed price: no spread, modifiers/add-ons add directly to a single price.
    let price = variant.startingPriceCents + surchargeCents;
    if (variant.minimumPriceCents !== null) {
      price = Math.max(price, variant.minimumPriceCents);
    }
    price = roundHighCents(price);
    return {
      status: "fixed",
      priceCents: price,
      basePriceCents: variant.startingPriceCents,
      breakdown,
    };
  }

  // Section 4 — ranged: derive base_low/base_high from the starting price via the default spread.
  const baseLowCents = Math.round(variant.startingPriceCents * (1 - DEFAULT_SPREAD));
  const baseHighCents = Math.round(variant.startingPriceCents * (1 + DEFAULT_SPREAD));

  let lowCents = baseLowCents + surchargeCents;
  let highCents = baseHighCents + surchargeCents;

  // Section 7 — minimum price floors the low bound only.
  // Rounding the low bound down (Section 9) could otherwise round it back
  // below a minimum that just clamped it (Section 7), silently breaking the
  // floor the contractor configured. When the minimum is what's binding,
  // round up instead — still outward, still a multiple of $25, never below
  // the minimum.
  let minimumIsBinding = false;
  if (variant.minimumPriceCents !== null && lowCents < variant.minimumPriceCents) {
    lowCents = variant.minimumPriceCents;
    minimumIsBinding = true;
  }

  // Section 9 — round outward so the displayed range always contains the calculated range.
  lowCents = minimumIsBinding ? roundHighCents(lowCents) : roundLowCents(lowCents);
  highCents = roundHighCents(highCents);

  // Section 7 guarantees the range can never invert, but its reasoning only
  // considers modifiers (all additive), not the minimum itself. A minimum
  // set above the entire base range — e.g. a $100 starting price for a
  // contractor who never quotes below their $150 trip charge — floors the
  // low bound past the untouched high bound and produced "$150–$125".
  //
  // The floor is the contractor's hard requirement, so the low bound stays
  // where the minimum put it and the high bound is carried up to meet it.
  // This only ever fires when the minimum is binding above the high bound;
  // in every other case the high bound is still untouched by the minimum,
  // exactly as Section 7 describes.
  if (highCents < lowCents) {
    highCents = lowCents;
  }

  return {
    status: "estimated",
    lowCents,
    highCents,
    baseLowCents,
    baseHighCents,
    breakdown,
  };
}
