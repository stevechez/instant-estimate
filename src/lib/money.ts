/**
 * Parses a contractor-entered dollar amount (e.g. "275", "$275.50", "1,200")
 * into integer cents. Returns null for blank/invalid input rather than 0, so
 * callers can distinguish "not entered" from "entered as zero".
 */
export function parseDollarsToCents(input: FormDataEntryValue | null | undefined): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().replace(/[$,]/g, "");
  if (trimmed === "") return null;

  const dollars = Number(trimmed);
  if (!Number.isFinite(dollars) || dollars < 0) return null;

  return Math.round(dollars * 100);
}

/**
 * The inverse of parseDollarsToCents, for pre-filling a form field: null
 * renders blank, and — critically — 0 renders "0.00", not blank. A naive
 * `cents ? ... : ""` check would treat a deliberately-saved $0 the same as
 * "never entered", making the two indistinguishable once redisplayed.
 */
export function centsToDollarStringOrBlank(cents: number | null): string {
  return cents !== null ? (cents / 100).toFixed(2) : "";
}
