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
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket_key: `${bucketKeyPrefix}:${ip}`,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    console.error("Rate limit check failed (failing open):", error);
    return true;
  }

  return data === true;
}
