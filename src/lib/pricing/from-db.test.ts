import { describe, expect, it } from "vitest";
import { buildServiceVariantPricingConfig } from "./from-db";
import { calculate } from "./engine";

describe("buildServiceVariantPricingConfig", () => {
  it("maps DB row shapes into the engine's config and produces the documented worked example", () => {
    // Same numbers as PRICING_ENGINE_SPEC.md Section 13 / engine.test.ts's
    // worked example, but built the way the real pricing setup page does:
    // through the DB row -> config mapping, not a hand-built config object.
    const config = buildServiceVariantPricingConfig({
      variant: { pricing_mode: "ranged", starting_price_cents: 120_000, minimum_price_cents: 90_000 },
      modifiers: [
        {
          key: "urgency_emergency",
          name: "Emergency",
          amount_cents: 15_000,
          condition_question_key: "urgency",
          condition_equals: "emergency",
          is_active: true,
        },
        {
          key: "after_hours",
          name: "After Hours",
          amount_cents: 7_500,
          condition_question_key: "after_hours",
          condition_equals: "true",
          is_active: true,
        },
      ],
      addOns: [
        { key: "haul_away_old_unit", name: "Haul Away Old Unit", amount_cents: 5_000, is_active: true },
      ],
      quoteOnlyRules: [],
      questions: [],
    });

    const result = calculate({
      variant: config,
      answers: { urgency: "emergency", after_hours: true },
      selectedAddOnKeys: ["haul_away_old_unit"],
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.lowCents).toBe(127_500);
    expect(result.highCents).toBe(167_500);
  });

  it("drops inactive modifiers, inactive add-ons, and malformed quote-only conditions", () => {
    const config = buildServiceVariantPricingConfig({
      variant: { pricing_mode: "ranged", starting_price_cents: 20_000, minimum_price_cents: null },
      modifiers: [
        {
          key: "retired_modifier",
          name: "Retired",
          amount_cents: 9_999,
          condition_question_key: "urgency",
          condition_equals: "emergency",
          is_active: false,
        },
      ],
      addOns: [
        { key: "retired_addon", name: "Retired", amount_cents: 9_999, is_active: false },
      ],
      quoteOnlyRules: [{ reason: "malformed", conditions: [{ questionKey: "x" }, "not an object", null] }],
      questions: [],
    });

    expect(config.modifiers).toHaveLength(0);
    expect(config.addOns).toHaveLength(0);
    expect(config.quoteOnlyRules).toEqual([{ reason: "malformed", conditions: [] }]);
  });

  it("only marks questions required_for_pricing and active as required", () => {
    const config = buildServiceVariantPricingConfig({
      variant: { pricing_mode: "ranged", starting_price_cents: 20_000, minimum_price_cents: null },
      modifiers: [],
      addOns: [],
      quoteOnlyRules: [],
      questions: [
        { key: "toilet_problem", required_for_pricing: true, is_active: true },
        { key: "optional_detail", required_for_pricing: false, is_active: true },
        { key: "retired_required", required_for_pricing: true, is_active: false },
      ],
    });

    expect(config.requiredAnswerKeys).toEqual(["toilet_problem"]);
  });
});
