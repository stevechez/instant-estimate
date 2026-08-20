/**
 * Pure header-parsing logic, separate from get-client-ip.ts (which is
 * server-only — touches next/headers) so this is directly unit-testable,
 * same pattern as lib/phone.ts and lib/sms/message.ts.
 */

/**
 * Headers carrying a caller IP, most trustworthy first.
 *
 * The distinction that matters is whether a client can forge the value.
 * `cf-connecting-ip` (Cloudflare) and `x-vercel-forwarded-for` (Vercel) are
 * set by that platform's edge and overwrite anything the client sent, so
 * they cannot be spoofed when running behind it. Plain `x-forwarded-for` is
 * only as trustworthy as whatever sits in front of the app — some proxies
 * *append* to a client-supplied value rather than replacing it, in which
 * case the first entry is attacker-controlled.
 *
 * Preferring the platform headers means that on Cloudflare or Vercel, an
 * attacker sending their own x-forwarded-for per request gets no benefit.
 */
const IP_HEADERS_BY_TRUST = ["cf-connecting-ip", "x-vercel-forwarded-for", "x-forwarded-for", "x-real-ip"] as const;

export type IpHeaderName = (typeof IP_HEADERS_BY_TRUST)[number];

/**
 * Resolves a caller identity for rate limiting from request headers.
 *
 * Values may be a chain ("client, proxy1, proxy2") appended to by each hop —
 * the first entry is the original client. Returns "unknown" when nothing
 * usable is present, so callers always get a bucket key rather than needing
 * to handle null; that lumps such callers together, which is the safe
 * direction (stricter, not laxer).
 */
export function parseClientIp(getHeader: (name: IpHeaderName) => string | null): string {
  for (const header of IP_HEADERS_BY_TRUST) {
    const raw = getHeader(header);
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first) return first;
  }
  return "unknown";
}
