import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "./get-client-ip";

/**
 * Checks and records one hit against a per-IP, per-action rate limit
 * (see supabase/migrations/20260820130000_rate_limiting.sql). Fails open —
 * a rate-limit infrastructure error must never block a legitimate homeowner
 * from using the widget, same best-effort philosophy as notifications and
 * photo uploads elsewhere in this flow.
 */
export async function checkRateLimit(
  bucketKeyPrefix: string,
  windowSeconds: number,
  limit: number
): Promise<boolean> {
  const ip = await getClientIp();
  return checkRateLimitForKey(`${bucketKeyPrefix}:${ip}`, windowSeconds, limit);
}

/**
 * Rate limit against something other than the caller's IP.
 *
 * IP-keyed limits assume the caller's identity can't be forged, which holds
 * behind Cloudflare or Vercel but not everywhere (see get-client-ip.ts). A
 * limit keyed on the *target* — the business being submitted to — needs no
 * such assumption: a distributed flood from a thousand addresses still hits
 * one shared counter, so a contractor can't be buried in fake leads (and
 * notification emails and texts) no matter how the traffic is spread.
 */
export async function checkRateLimitForKey(
  bucketKey: string,
  windowSeconds: number,
  limit: number
): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket_key: bucketKey,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    console.error("Rate limit check failed (failing open):", error);
    return true;
  }

  return data === true;
}
