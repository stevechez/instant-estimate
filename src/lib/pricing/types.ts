/**
 * Domain types for the pricing engine.
 *
 * These are intentionally decoupled from the Supabase row shapes (see
 * `from-db.ts` for the mapping) so that `engine.ts` stays a pure,
 * dependency-free function per docs/PRICING_ENGINE_SPEC.md Section 1:
 * deterministic, predictable, testable, explainable, independent of AI
 * model output.
 *
 * All money values are integer cents.
 */

export type PricingAnswerValue = string | number | boolean | null | undefined;

/** Structured homeowner answers, keyed by question key (e.g. "urgency"). */
export type PricingAnswers = Record<string, PricingAnswerValue>;

export interface PricingModifierConfig {
  key: string;
  name: string;
  amountCents: number;
  /** The question key this modifier is conditioned on, e.g. "urgency". */
  conditionQuestionKey: string;
  /** The answer value (compared as a string) that activates this modifier. */
  conditionEquals: string;
}

export interface PricingAddOnConfig {
  key: string;
  name: string;
  amountCents: number;
}

export interface QuoteOnlyCondition {
  questionKey: string;
  equals: string;
}

export interface QuoteOnlyRuleConfig {
  reason: string;
  /** All conditions must match (AND) for this rule to force a quote. */
  conditions: QuoteOnlyCondition[];
}

export type PricingMode = "ranged" | "fixed";

export interface ServiceVariantPricingConfig {
  pricingMode: PricingMode;
  /** Contractor-entered "normal starting price", in cents. */
  startingPriceCents: number;
  /** Floor on the low bound (ranged) or the single price (fixed). */
  minimumPriceCents: number | null;
  modifiers: PricingModifierConfig[];
  addOns: PricingAddOnConfig[];
  quoteOnlyRules: QuoteOnlyRuleConfig[];
  /** Question keys that must be present in `answers` to calculate at all. */
  requiredAnswerKeys: string[];
}

export interface PricingInput {
  /** Null when the resolved service/variant has no active pricing configuration — see engine.ts's "not_configured" refusal. */
  variant: ServiceVariantPricingConfig | null;
  answers: PricingAnswers;
  selectedAddOnKeys: string[];
}

/** A modifier or add-on that contributed a non-zero amount, for the explainability breakdown (Section 12). */
export interface PricingBreakdownLine {
  key: string;
  label: string;
  amountCents: number;
}

export type QuoteRequiredReason =
  | "not_configured"
  | "missing_required_input"
  | "quote_only_rule";

export type PricingResult =
  | {
      status: "estimated";
      lowCents: number;
      highCents: number;
      /** The pre-surcharge base range, before modifiers/add-ons/rounding — Section 4. */
      baseLowCents: number;
      baseHighCents: number;
      /** Modifiers and add-ons that contributed a non-zero amount, in the order they were evaluated. */
      breakdown: PricingBreakdownLine[];
    }
  | {
      status: "fixed";
      priceCents: number;
      /** The pre-surcharge starting price, before modifiers/add-ons/rounding — Section 10. */
      basePriceCents: number;
      breakdown: PricingBreakdownLine[];
    }
  | {
      status: "quote_required";
      reason: QuoteRequiredReason;
      /** Populated when reason is "missing_required_input". */
      missingAnswerKeys?: string[];
      /** Populated when reason is "quote_only_rule". */
      ruleReason?: string;
    };
