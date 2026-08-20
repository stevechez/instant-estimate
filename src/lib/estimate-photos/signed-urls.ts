import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "estimate-photos";

/** Long enough to cover viewing one dashboard page load, short enough that a leaked link goes stale quickly. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * The estimate-photos bucket is private (no anon/authenticated storage
 * policies — see 20260819120000_init_schema.sql's storage comment), so the
 * contractor dashboard needs signed URLs, generated with the service-role
 * client, to actually render photos. Callers must have already verified the
 * viewer owns the business these photos belong to (see loadOwnedLead) —
 * this function does no authorization of its own.
 */
export async function getSignedEstimatePhotoUrls(
  supabase: ReturnType<typeof createAdminClient>,
  storagePaths: string[]
): Promise<string[]> {
  if (storagePaths.length === 0) return [];

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    console.error("Failed to create signed URLs for estimate photos:", error);
    return [];
  }

  return data.flatMap((d) => (d.signedUrl ? [d.signedUrl] : []));
}
