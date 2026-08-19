import type { PricingResult } from "./types";

/** $250, not $250.00 — PRODUCT_SPEC.md Section 14 explicitly warns against false precision like $287.43. */
export function formatMoney(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/** Renders a PricingResult the way a homeowner (or a contractor previewing their setup) would see it. */
export function formatEstimateResult(result: PricingResult): string {
  switch (result.status) {
    case "estimated":
      return `${formatMoney(result.lowCents)}–${formatMoney(result.highCents)}`;
    case "fixed":
      return formatMoney(result.priceCents);
    case "quote_required":
      return "Quote required";
  }
}
