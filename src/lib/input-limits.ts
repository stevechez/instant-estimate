/**
 * Length limits for homeowner-supplied input on the public estimate widget.
 *
 * The widget's server actions are reachable by anyone (Server Actions are
 * POST endpoints — the browser form is not the only possible caller), so
 * these are a trust boundary, not UI validation. Rate limiting caps how
 * *often* a caller can post; these cap how *much* each post can carry.
 *
 * Limits are deliberately generous — well beyond any legitimate value — so
 * they only ever fire on abuse, never on a real homeowner. They mirror the
 * CHECK constraints in supabase/migrations/20260820140000_integrity_hardening.sql,
 * which are the backstop if a future code path forgets to call these.
 *
 * Pure and dependency-free so it's directly unit-testable, same pattern as
 * lib/phone.ts and lib/pricing/format.ts.
 */

export const INPUT_LIMITS = {
  /** Also the payload forwarded to the Anthropic API by classifyDescription — the one field with a per-request cost attached. */
  description: 5000,
  name: 200,
  phone: 40,
  /** RFC 5321 maximum path length. */
  email: 320,
  serviceAddress: 500,
  preferredContactMethod: 100,
  preferredServiceTiming: 200,
  /** Add-on keys are contractor-defined slugs; a homeowner selecting more than this is not a real selection. */
  addOnKeyCount: 50,
  addOnKeyLength: 100,
} as const;

export type InputLimitField = keyof typeof INPUT_LIMITS;

/** True when `value` is within the named limit. Null/undefined always passes — absence is the caller's concern, not this module's. */
export function withinLimit(value: string | null | undefined, field: InputLimitField): boolean {
  if (value === null || value === undefined) return true;
  return value.length <= (INPUT_LIMITS[field] as number);
}

/**
 * Drops anything that isn't a plausible add-on key before it reaches the
 * pricing engine, which does an O(n·m) `includes()` against the variant's
 * real add-ons. The engine already ignores unknown keys, so this is about
 * bounding the work, not correctness.
 */
export function sanitizeAddOnKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  return keys
    .filter((key): key is string => typeof key === "string" && key.length <= INPUT_LIMITS.addOnKeyLength)
    .slice(0, INPUT_LIMITS.addOnKeyCount);
}
