import { describe, expect, it } from "vitest";
import { calculate } from "./engine";
import type { PricingInput, ServiceVariantPricingConfig } from "./types";

/** docs/PRICING_ENGINE_SPEC.md Section 13 — Water Heater Repair/Replacement, variant = replacement. */
function waterHeaterReplacementVariant(): ServiceVariantPricingConfig {
  return {
    pricingMode: "ranged",
    startingPriceCents: 120_000,
    minimumPriceCents: 90_000,
    modifiers: [
      {
        key: "urgency_emergency",
        name: "Emergency",
        amountCents: 15_000,
        conditionQuestionKey: "urgency",
        conditionEquals: "emergency",
      },
      {
        key: "after_hours",
        name: "After Hours",
        amountCents: 7_500,
        conditionQuestionKey: "after_hours",
        conditionEquals: "true",
      },
    ],
    addOns: [{ key: "haul_away_old_unit", name: "Haul Away Old Unit", amountCents: 5_000 }],
    quoteOnlyRules: [],
    requiredAnswerKeys: [],
  };
}

describe("calculate — worked example (spec Section 13)", () => {
  it("matches the spec's documented result exactly", () => {
    const input: PricingInput = {
      variant: waterHeaterReplacementVariant(),
      answers: { urgency: "emergency", after_hours: true },
      selectedAddOnKeys: ["haul_away_old_unit"],
    };

    const result = calculate(input);

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.baseLowCents).toBe(102_000);
    expect(result.baseHighCents).toBe(138_000);
    expect(result.lowCents).toBe(127_500);
    expect(result.highCents).toBe(167_500);
    expect(result.breakdown).toEqual([
      { key: "urgency_emergency", label: "Emergency", amountCents: 15_000 },
      { key: "after_hours", label: "After Hours", amountCents: 7_500 },
      { key: "haul_away_old_unit", label: "Haul Away Old Unit", amountCents: 5_000 },
    ]);
  });
});

describe("calculate — base range (Section 4)", () => {
  it("derives a ±15% spread from the starting price with no modifiers or add-ons", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 20_000,
      minimumPriceCents: null,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: [],
    };

    const result = calculate({ variant, answers: {}, selectedAddOnKeys: [] });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    // base 17,000 - 23,000, rounded outward to the nearest $25 (2,500 cents)
    expect(result.baseLowCents).toBe(17_000);
    expect(result.baseHighCents).toBe(23_000);
    expect(result.lowCents).toBe(15_000);
    expect(result.highCents).toBe(25_000);
    expect(result.breakdown).toEqual([]);
  });
});

describe("calculate — modifiers (Section 5)", () => {
  it("ignores a modifier whose condition does not match the answers", () => {
    const variant = waterHeaterReplacementVariant();
    const result = calculate({
      variant,
      answers: { urgency: "normal", after_hours: false },
      selectedAddOnKeys: [],
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.breakdown).toEqual([]);
    // base 102,000 - 138,000, rounded outward to the nearest $25
    expect(result.lowCents).toBe(100_000);
    expect(result.highCents).toBe(140_000);
  });

  it("is order-independent since every modifier is a flat, non-negative amount", () => {
    const variant = waterHeaterReplacementVariant();
    const reordered: ServiceVariantPricingConfig = {
      ...variant,
      modifiers: [...variant.modifiers].reverse(),
    };

    const a = calculate({
      variant,
      answers: { urgency: "emergency", after_hours: true },
      selectedAddOnKeys: [],
    });
    const b = calculate({
      variant: reordered,
      answers: { urgency: "emergency", after_hours: true },
      selectedAddOnKeys: [],
    });

    // The bound totals must be identical regardless of configuration order;
    // only the breakdown line ordering is allowed to differ.
    if (a.status !== "estimated" || b.status !== "estimated") throw new Error("expected estimated");
    expect(a.lowCents).toBe(b.lowCents);
    expect(a.highCents).toBe(b.highCents);
    expect([...a.breakdown].sort((x, y) => x.key.localeCompare(y.key))).toEqual(
      [...b.breakdown].sort((x, y) => x.key.localeCompare(y.key))
    );
  });
});

describe("calculate — add-ons (Section 6)", () => {
  it("only applies add-ons the homeowner selected", () => {
    const variant = waterHeaterReplacementVariant();
    const result = calculate({
      variant,
      answers: {},
      selectedAddOnKeys: [],
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.breakdown.some((line) => line.key === "haul_away_old_unit")).toBe(false);
  });
});

describe("calculate — minimum price (Section 7)", () => {
  it("floors only the low bound, never adjusting the high bound", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 10_000, // base 8,500 - 11,500
      minimumPriceCents: 9_500,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: [],
    };

    const result = calculate({ variant, answers: {}, selectedAddOnKeys: [] });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    // low clamps to the 9,500 minimum, then rounds UP (not down) to 10,000 so
    // the displayed bound never falls back below the contractor's floor.
    expect(result.lowCents).toBe(10_000);
    expect(result.lowCents).toBeGreaterThanOrEqual(9_500);
    // high is unaffected by the minimum: 11,500 rounds up to 12,500.
    expect(result.highCents).toBe(12_500);
  });

  it("has no effect when the calculated low bound already clears the minimum", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 100_000,
      minimumPriceCents: 10_000,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: [],
    };

    const result = calculate({ variant, answers: {}, selectedAddOnKeys: [] });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.lowCents).toBe(85_000);
  });
});

describe("calculate — rounding (Section 9)", () => {
  it("rounds the low bound down and the high bound up to the nearest $25, always widening never narrowing", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 21_300, // base low 18,105, base high 24,495
      minimumPriceCents: null,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: [],
    };

    const result = calculate({ variant, answers: {}, selectedAddOnKeys: [] });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.lowCents).toBeLessThanOrEqual(result.baseLowCents);
    expect(result.highCents).toBeGreaterThanOrEqual(result.baseHighCents);
    expect(result.lowCents % 2_500).toBe(0);
    expect(result.highCents % 2_500).toBe(0);
  });
});

describe("calculate — fixed price (Section 10)", () => {
  it("returns a single price with no spread, surcharges applied directly", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "fixed",
      startingPriceCents: 9_900,
      minimumPriceCents: null,
      modifiers: [
        {
          key: "after_hours",
          name: "After Hours",
          amountCents: 2_500,
          conditionQuestionKey: "after_hours",
          conditionEquals: "true",
        },
      ],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: [],
    };

    const result = calculate({ variant, answers: { after_hours: true }, selectedAddOnKeys: [] });

    expect(result.status).toBe("fixed");
    if (result.status !== "fixed") return;
    expect(result.basePriceCents).toBe(9_900);
    // 9900 + 2500 = 12400, rounded up to nearest 2500 -> 12500
    expect(result.priceCents).toBe(12_500);
  });

  it("applies the minimum as a floor on the single price", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "fixed",
      startingPriceCents: 5_000,
      minimumPriceCents: 7_500,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: [],
    };

    const result = calculate({ variant, answers: {}, selectedAddOnKeys: [] });

    expect(result.status).toBe("fixed");
    if (result.status !== "fixed") return;
    expect(result.priceCents).toBe(7_500);
  });
});

describe("calculate — refusal to estimate (Section 11)", () => {
  it("refuses with not_configured when no variant configuration is available", () => {
    const result = calculate({ variant: null, answers: {}, selectedAddOnKeys: [] });
    expect(result).toEqual({ status: "quote_required", reason: "not_configured" });
  });

  it("refuses with missing_required_input when a required answer is absent", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 20_000,
      minimumPriceCents: null,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: ["toilet_problem"],
    };

    const result = calculate({ variant, answers: {}, selectedAddOnKeys: [] });

    expect(result).toEqual({
      status: "quote_required",
      reason: "missing_required_input",
      missingAnswerKeys: ["toilet_problem"],
    });
  });

  it("treats an empty string or null answer as missing, not a valid value", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 20_000,
      minimumPriceCents: null,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      requiredAnswerKeys: ["toilet_problem"],
    };

    const result = calculate({
      variant,
      answers: { toilet_problem: "" },
      selectedAddOnKeys: [],
    });

    expect(result.status).toBe("quote_required");
  });

  it("refuses with quote_only_rule when every condition on a rule matches", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 20_000,
      minimumPriceCents: null,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [
        {
          reason: "Commercial properties require an in-person quote",
          conditions: [{ questionKey: "property_type", equals: "commercial" }],
        },
      ],
      requiredAnswerKeys: [],
    };

    const result = calculate({
      variant,
      answers: { property_type: "commercial" },
      selectedAddOnKeys: [],
    });

    expect(result).toEqual({
      status: "quote_required",
      reason: "quote_only_rule",
      ruleReason: "Commercial properties require an in-person quote",
    });
  });

  it("does not trigger a quote-only rule when only some of its conditions match", () => {
    const variant: ServiceVariantPricingConfig = {
      pricingMode: "ranged",
      startingPriceCents: 20_000,
      minimumPriceCents: null,
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [
        {
          reason: "unreachable",
          conditions: [
            { questionKey: "property_type", equals: "commercial" },
            { questionKey: "floors", equals: "3" },
          ],
        },
      ],
      requiredAnswerKeys: [],
    };

    const result = calculate({
      variant,
      answers: { property_type: "commercial", floors: "1" },
      selectedAddOnKeys: [],
    });

    expect(result.status).toBe("estimated");
  });
});

describe("calculate — determinism", () => {
  it("returns an identical result for identical input, called repeatedly", () => {
    const input: PricingInput = {
      variant: waterHeaterReplacementVariant(),
      answers: { urgency: "emergency", after_hours: true },
      selectedAddOnKeys: ["haul_away_old_unit"],
    };

    expect(calculate(input)).toEqual(calculate(input));
    expect(calculate(input)).toEqual(calculate(structuredClone(input)));
  });
});
