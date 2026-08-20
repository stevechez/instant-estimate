import "server-only";
import { randomUUID } from "node:crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import { buildPhotoStoragePath, selectValidPhotos } from "./validate";

const BUCKET = "estimate-photos";

/**
 * Uploads homeowner-submitted photos and records them against the estimate
 * (PRODUCT_SPEC.md Section 10). Best-effort per file, same philosophy as the
 * lead notification channels: photos are supporting evidence, so one bad
 * file — or storage being briefly unavailable — must never block the lead
 * submission this is called from. Errors are logged and swallowed.
 */
export async function uploadEstimatePhotos(
  supabase: ReturnType<typeof createAdminClient>,
  estimateId: string,
  files: File[]
): Promise<void> {
  const { valid } = selectValidPhotos(files);

  for (const file of valid) {
    try {
      const path = buildPhotoStoragePath(estimateId, file, randomUUID());
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined });

      if (uploadError) {
        console.error("Failed to upload estimate photo:", uploadError);
        continue;
      }

      const { error: insertError } = await supabase
        .from("estimate_photos")
        .insert({ estimate_id: estimateId, storage_path: path });

      if (insertError) {
        // Leaves an orphaned storage object — acceptable for MVP; cleanup
        // of unreferenced objects is a housekeeping concern, not a
        // correctness one (nothing reads storage without going through
        // estimate_photos rows).
        console.error("Failed to record estimate photo:", insertError);
      }
    } catch (err) {
      console.error("Unexpected error uploading estimate photo:", err);
    }
  }
}
