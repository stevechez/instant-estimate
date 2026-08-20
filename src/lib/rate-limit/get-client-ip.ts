import "server-only";
import { headers } from "next/headers";
import { parseClientIp, type IpHeaderName } from "./client-ip";

/**
 * Best-effort caller identity for rate limiting — see parseClientIp for the
 * fallback chain.
 *
 * DEPLOYMENT REQUIREMENT: behind Cloudflare or Vercel this is spoof-proof —
 * parseClientIp prefers those platforms' own headers, which their edge
 * overwrites. Anywhere else it is only as trustworthy as the proxy in front
 * of the app: exposed directly to the internet, or behind a proxy that
 * *appends* to a client-supplied X-Forwarded-For rather than replacing it, a
 * caller can send a fresh value per request, get a fresh bucket each time,
 * and the limits in ./limits.ts stop meaning anything. If you deploy behind
 * your own nginx, set `proxy_set_header X-Forwarded-For $remote_addr`.
 *
 * Note that the per-business limit on lead submission (see limits.ts) does
 * not depend on this holding — it is keyed by business id, so it caps the
 * damage to any one contractor even if IP identity is being forged.
 *
 * This is the deployment assumption the public widget's abuse protection
 * rests on (see lib/rate-limit/check.ts and its callers in
 * app/e/[slug]/actions.ts), so verify it holds on whatever hosts this.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return parseClientIp((name: IpHeaderName) => h.get(name));
}
