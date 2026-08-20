import "server-only";
import { headers } from "next/headers";
import { parseClientIp } from "./client-ip";

/**
 * Best-effort caller identity for rate limiting — see parseClientIp for the
 * fallback chain.
 *
 * DEPLOYMENT REQUIREMENT: these headers are only trustworthy if the edge in
 * front of this app overwrites them. Vercel, Cloudflare and a correctly
 * configured nginx (`proxy_set_header X-Forwarded-For $remote_addr`) all do.
 * Exposed directly to the internet, or behind a proxy that *appends* to a
 * client-supplied value, a caller can put anything here — a fresh
 * X-Forwarded-For per request means a fresh rate-limit bucket per request,
 * and the limits in ./limits.ts stop meaning anything.
 *
 * This is the deployment assumption the public widget's abuse protection
 * rests on (see lib/rate-limit/check.ts and its callers in
 * app/e/[slug]/actions.ts), so verify it holds on whatever hosts this.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return parseClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}
