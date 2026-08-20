import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Permanently deletes a contractor's account and everything belonging to it.
 *
 * The database side is handled by ON DELETE CASCADE from auth.users: removing
 * the user removes their business, and the business removes its services,
 * variants, pricing rules, estimates, estimate_photos rows, and leads.
 *
 * Storage is NOT part of that cascade. Deleting the estimate_photos row does
 * nothing to the actual image file in the bucket, so a naive "delete the
 * user" implementation leaves every homeowner-submitted photo and every
 * uploaded logo sitting in storage indefinitely — precisely the personal data
 * the deletion was supposed to remove. Storage objects are therefore
 * collected and removed first, while the rows that point to them still exist.
 *
 * Ordering matters and is deliberate:
 *   1. read the storage paths (needs the DB rows intact)
 *   2. delete the storage objects
 *   3. delete the auth user, which cascades the rows
 *
 * If step 2 partially fails the account still deletes; the caller logs it.
 * Leaving a user unable to delete their account because one image failed to
 * remove would be the worse outcome.
 */
export async function deleteAccountAndData(userId: string, businessId: string | null): Promise<void> {
  const admin = createAdminClient();

  if (businessId) {
    // Photos: joined through estimates, since estimate_photos has no business_id.
    const { data: estimates } = await admin.from("estimates").select("id").eq("business_id", businessId);
    const estimateIds = (estimates ?? []).map((row) => row.id);

    if (estimateIds.length > 0) {
      const { data: photos } = await admin
        .from("estimate_photos")
        .select("storage_path")
        .in("estimate_id", estimateIds);

      const photoPaths = (photos ?? []).map((row) => row.storage_path);
      if (photoPaths.length > 0) {
        const { error } = await admin.storage.from("estimate-photos").remove(photoPaths);
        if (error) console.error("Account deletion: failed to remove estimate photos:", error);
      }
    }

    // Logos: stored under a business-id prefix, so list rather than tracking
    // individual paths — re-uploading a logo leaves the previous object behind
    // (logo_url only ever points at the newest one), and those older objects
    // must go too.
    const { data: logoObjects, error: listError } = await admin.storage.from("business-logos").list(businessId);
    if (listError) {
      console.error("Account deletion: failed to list business logos:", listError);
    } else if (logoObjects && logoObjects.length > 0) {
      const logoPaths = logoObjects.map((object) => `${businessId}/${object.name}`);
      const { error } = await admin.storage.from("business-logos").remove(logoPaths);
      if (error) console.error("Account deletion: failed to remove business logos:", error);
    }
  }

  // Cascades the entire row graph. Throws to the caller on failure, since an
  // account that reports "deleted" while still existing is not acceptable.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}
