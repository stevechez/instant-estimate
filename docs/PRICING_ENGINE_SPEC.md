# Instant Estimate — Pricing Engine Specification

**Status:** Active
**Version:** 1.0
**Last Updated:** 2026-08-19
**Product:** Instant Estimate
**Related Specification:** `PRODUCT_SPEC.md`

---

# 1. Purpose

This document defines how Instant Estimate converts homeowner-provided information and contractor-configured pricing rules into an estimate.

The pricing engine is one of the core systems of Instant Estimate.

Its responsibilities are intentionally narrow:

1. receive structured homeowner inputs
2. identify the applicable service configuration
3. apply contractor-defined pricing rules
4. calculate an estimate
5. return an estimate range or a fixed price
6. explain the estimate at an appropriate level
7. refuse to produce an estimate when the configured rules do not support one

The pricing engine must be:

- deterministic
- predictable
- testable
- explainable
- contractor-controlled
- independent of AI model output

---

# 2. Core Principle

> **AI interprets the homeowner. The pricing engine determines the price.**

AI may determine:

- likely service
- relevant questions
- interpretation of natural-language answers
- whether information is ambiguous

AI must not independently determine:

- the contractor's price
- price modifiers
- minimum charges
- maximum charges
- discounts
- emergency fees
- material costs

All customer-facing pricing must ultimately originate from contractor-configured pricing data.

---

# 3. Pricing Engine Boundary

The pricing engine receives structured information. It never receives free-text homeowner input, an uploaded photo, or a raw AI completion — that interpretation happens upstream and is out of scope for this document.

Example input:

```text
service = toilet_repair
variant = repair

toilet_problem = constantly_running
visible_leak = false
flushes_normally = true

urgency = normal
after_hours = false
weekend = false

add_ons = []
```

Example output (range):

```text
status = estimated
low = 175
high = 250
breakdown:
  base (toilet_repair / repair): 150–200
  + urgency (normal): 0
  + after_hours: 0
  minimum applied: no
```

Example output (refusal):

```text
status = quote_required
reason = missing_required_input
missing = [toilet_problem]
```

The pricing engine's contract is a pure function:

```text
calculate(service, variant, answers, modifiers_selected, add_ons_selected)
  → { status: "estimated", low, high, breakdown }
  → { status: "fixed", price, breakdown }
  → { status: "quote_required", reason }
```

Given the same service configuration and the same structured inputs, the engine always returns the same result. It does not call an AI model, does not use randomness, and does not consult any state outside the contractor's active pricing configuration.

---

# 4. Base Price Configuration

Every service **variant** (e.g. `toilet_repair / repair`, `toilet_repair / replacement`) has its own base price configuration. A variant is not a modifier on top of a shared base — it is a distinct starting point, because a repair and a replacement are different jobs with different normal costs.

For each variant, the contractor enters a single **starting price** (e.g. `$275`). This is the only number a contractor is required to think about when configuring a service.

The system derives a base range from that starting price using a fixed default spread:

```text
base_low  = starting_price × (1 − 0.15)
base_high = starting_price × (1 + 0.15)
```

The ±15% spread is a system default, not a per-contractor setting in V1. It exists so that a contractor who enters one honest number gets a credible-looking range without having to reason about range construction themselves, consistent with the product spec's requirement for an opinionated setup experience.

A contractor may instead mark a variant as **fixed price** (Section 10), in which case no spread is applied.

---

# 5. Modifiers

Modifiers represent situational surcharges: urgency, after-hours, weekend, complexity, location, property type, and any other dimension the initial plumbing configuration requires (Section 12 of the product spec).

**Modifiers are flat dollar amounts, not percentages.** A contractor configures each modifier as a single `+$X` (or `$0`) applied uniformly. Example:

```text
urgency = emergency   → +$75
after_hours = true    → +$50
weekend = true         → +$25
```

A modifier applies the same dollar amount to both the low and high bound of the current range. This keeps the arithmetic something a non-technical contractor can predict exactly when they type a number in, and avoids the compounding surprises percentage-based stacking would introduce when several modifiers apply at once.

Only modifiers relevant to the identified variant are evaluated. A modifier a contractor has not configured for a given service defaults to `$0` and has no effect.

Modifiers are additive and order-independent — because every modifier is a flat amount applied identically to both bounds, the order they are summed in does not change the result.

---

# 6. Add-Ons

Add-ons are optional extra work items the homeowner (or the question flow) can select in addition to the base service, e.g. "haul away old water heater," "install new shutoff valve."

Each add-on the contractor configures has a single flat price (`+$X`), applied to both bounds, identically to a modifier. An add-on only affects the estimate when the homeowner has selected it; unselected add-ons have no effect.

---

# 7. Minimum Price

A service variant may have a contractor-configured **minimum price**. The minimum is a floor on the **low** bound only:

```text
low = max(low, minimum)
```

If modifiers or add-ons already push the low bound above the minimum, the minimum has no effect. Otherwise the minimum compresses the width of the range from below.

The high bound is not adjusted because of the minimum, **except** in the one case where the minimum sits above the high bound entirely:

```text
high = max(high, low)
```

Without that clamp the range inverts. The original reasoning here — that inversion is impossible because all modifiers are additive and non-negative — only covered modifiers; it missed the minimum itself, which needs no modifiers to exceed the high bound. A $100 starting price with a $150 minimum yields a base range of $85–$115, floors the low bound to $150, and leaves the high bound at $125: the homeowner is shown "$150–$125". This is ordinary configuration for a contractor who never quotes below their trip charge, not an edge case.

The floor is the contractor's hard requirement, so the low bound stays where the minimum put it and the high bound is carried up to meet it. The resulting range is a single point (`$150–$150`) rather than an invalid one.

**The invariants are therefore: the range never inverts (`high >= low`), and the contractor's stated floor is always honored.**

---

# 8. Calculation Order

The engine always evaluates in this fixed order:

1. Resolve the service **variant** → base_low, base_high (Section 4), unless the variant is fixed price (Section 10).
2. Sum all applicable **modifiers** (Section 5) and add the total to both bounds.
3. Sum all selected **add-ons** (Section 6) and add the total to both bounds.
4. Apply the **minimum price** floor to the low bound only (Section 7).
5. **Round** both bounds (Section 9).

Because every modifier and add-on is a flat, non-negative dollar amount, steps 2–3 are commutative — the engine does not need to define a priority order between, say, urgency and after-hours. This is a deliberate simplification to keep the model easy to reason about and to configure; it is not intended to support arbitrary rule interactions.

---

# 9. Rounding

Displayed estimates are rounded to avoid false precision:

```text
low  = floor(low  / 25) × 25
high = ceil(high / 25) × 25
```

Rounding the low bound down and the high bound up (rather than to nearest) guarantees the rounded range still contains the unrounded calculated range — the homeowner is never quoted a bound narrower than what the rules actually computed.

**Interaction with the minimum price:** flooring the low bound down after the minimum (Section 7) has already clamped it to the minimum could round it back below that minimum, silently undermining the floor the contractor configured. When the minimum is the binding constraint, the low bound rounds **up** instead of down. The low bound only ever rounds down when it was not set by the minimum.

Fixed-price services (Section 10) are also rounded to the nearest $25 for display, since a fixed price is still ultimately derived from configured dollar amounts rather than something requiring cent-level precision.

---

# 10. Fixed-Price Services

A contractor may mark a specific variant as fixed price instead of ranged (product spec, Section 14). In this mode:

- no ±15% spread is applied to the starting price
- modifiers and add-ons add directly to the single price rather than to a low/high pair
- the minimum price is a floor on the single resulting price
- the output `status` is `fixed`, not `estimated`, and the UI displays a single number rather than a range

Fixed price is expected to be used sparingly in V1 (e.g. a flat diagnostic/trip fee), not as the default configuration for most services.

---

# 11. Refusal to Estimate

The pricing engine returns `status = "quote_required"` — never a fabricated number — whenever it cannot produce a defensible estimate. This is the pricing engine's half of the product spec's Section 15 behavior; the other half (AI classification confidence) happens upstream and never reaches this engine at all — an unclassified or low-confidence request simply never calls `calculate()`.

Within its own boundary, the engine refuses when:

1. **No active pricing configuration exists** for the resolved service/variant (the contractor hasn't configured or hasn't activated it).
2. **A required input is missing.** A contractor can mark specific answers as required for pricing (e.g. `toilet_problem` must be known to price a toilet repair); if the structured input omits a required field, the engine refuses rather than guessing a default.
3. **The contractor has explicitly flagged the specific answer combination as quote-only.** This is an escape hatch for in-scope services that still have edge cases a contractor doesn't want auto-priced (e.g. `property_type = commercial` on an otherwise residential service). It is configured the same way a modifier is, but instead of contributing a dollar amount it short-circuits the calculation straight to `quote_required`.

A refusal is not an error condition — it is a normal, expected output type that the homeowner-facing flow treats as a valid outcome, routing to the request-for-quote / contractor-confirmation path described in the product spec.

---

# 12. Explainability

Every `estimated` or `fixed` result includes a `breakdown`: the base range/price, and each modifier or add-on that contributed a non-zero amount, by name. This is what lets the contractor dashboard show *why* a given estimate came out the way it did (product spec, Section 17), and lets the homeowner-facing UI avoid presenting the number as an unexplained black box.

The breakdown is generated directly from the same calculation in Section 8 — it is not a separate explanation subsystem, and it cannot drift from the number actually shown.

---

# 13. Worked Example

**Service:** Water Heater Repair / Replacement, variant = `replacement`
**Contractor configuration:**

```text
starting_price = 1200        (spread → base_low 1020, base_high 1380)
urgency.emergency = +150
after_hours = +75
add_on.haul_away_old_unit = +50
minimum = 900
```

**Homeowner input:**

```text
urgency = emergency
after_hours = true
add_ons = [haul_away_old_unit]
```

**Calculation:**

```text
base:            1020 – 1380
+ urgency:        150 –  150   → 1170 – 1530
+ after_hours:      75 –   75   → 1245 – 1605
+ add_on:            50 –   50   → 1295 – 1655
minimum (900):    no change (1295 already > 900)
rounded ($25):   floor(1295/25)×25 = 1275, ceil(1655/25)×25 = 1675 → 1275 – 1675
```

**Output:**

```text
status = estimated
low = 1275
high = 1675
breakdown:
  base (water_heater / replacement): 1020–1380
  + urgency (emergency): +150
  + after_hours: +75
  + add_on (haul_away_old_unit): +50
```

---

# 14. Out of Scope for V1

The following are explicitly not part of the V1 pricing engine, consistent with the product spec's instruction to implement only the pricing dimensions the initial plumbing configuration requires:

- percentage-based or compounding modifiers
- modifier priority/ordering rules
- per-modifier min/max caps
- discounts or promotional pricing
- geographic/zip-code-based pricing tables
- contractor-defined formulas or a general expression language
- multi-currency support
- tax calculation

Any of these may be reconsidered post-MVP if real contractor configurations demonstrate the flat-dollar, single-spread model is insufficient.
