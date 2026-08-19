/**
 * Normalizes a contractor-entered phone number to E.164 (e.g. "+15551234567"),
 * the format Twilio (and the SMS network generally) requires. Returns null
 * for anything that can't be confidently normalized, rather than guessing —
 * same "prefer uncertainty over fabricated confidence" reasoning the rest of
 * this app applies to AI classification and pricing.
 *
 * Assumes a US/Canada number (+1) when no country code is given — reasonable
 * for this product's initial market (PRODUCT_SPEC.md Section 6), not a
 * general-purpose international phone parser.
 */
export function normalizePhoneToE164(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^0-9]/g, "");

  if (hasLeadingPlus) {
    // Already has an explicit country code — just validate the digit count
    // (E.164 allows up to 15 digits total, minimum a country code + a few more).
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
}
