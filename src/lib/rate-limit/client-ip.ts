/**
 * Pure header-parsing logic, separate from get-client-ip.ts (which is
 * server-only — touches next/headers) so this is directly unit-testable,
 * same pattern as lib/phone.ts and lib/sms/message.ts.
 */

/**
 * x-forwarded-for can carry a chain ("client, proxy1, proxy2") appended to
 * by every hop — the first entry is the original client. Falls back to
 * x-real-ip (set by some proxies instead), then "unknown" so callers always
 * get a usable (if coarse) bucket key rather than needing to handle null.
 */
export function parseClientIp(forwardedFor: string | null, realIp: string | null): string {
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}
