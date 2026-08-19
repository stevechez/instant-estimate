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
