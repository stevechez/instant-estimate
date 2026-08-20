"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { normalizePhoneToE164 } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildLogoStoragePath, validateLogoFile } from "@/lib/business-logo/validate";
import { deleteAccountAndData } from "@/lib/account/delete-account";
import { redirect } from "next/navigation";

const LOGO_BUCKET = "business-logos";

export type UpdateNotificationPhoneState =
  | { status: "error"; message: string }
  | { status: "saved" }
  | undefined;

export async function updateNotificationPhone(
  _prevState: UpdateNotificationPhoneState,
  formData: FormData
): Promise<UpdateNotificationPhoneState> {
  const ctx = await requireUser();
  const business = await getOwnedBusiness(ctx);
  if (!business) {
    return { status: "error", message: "Business not found." };
  }

  const raw = String(formData.get("notification_phone") ?? "").trim();

  // Blank clears it (turns SMS off); anything else must normalize cleanly —
  // don't silently store something Twilio would reject later.
  let normalized: string | null = null;
  if (raw !== "") {
    normalized = normalizePhoneToE164(raw);
    if (!normalized) {
      return { status: "error", message: "Enter a valid phone number, e.g. (555) 123-4567." };
    }
  }

  const { error } = await ctx.supabase
    .from("businesses")
    .update({
      notification_phone: normalized,
      // A different number has its own subscription status with Twilio, so
      // the previous number's observed opt-out no longer describes anything.
      // (Re-entering the same opted-out number clears the flag too — it will
      // simply be set again on the next rejected send, which is the honest
      // outcome: we cannot know Twilio's current state without trying.)
      sms_opted_out_at: null,
    })
    .eq("id", business.id);

  if (error) {
    return { status: "error", message: "Something went wrong saving your settings. Try again." };
  }

  revalidatePath("/dashboard/settings");
  return { status: "saved" };
}

export type UpdateBusinessLogoState =
  | { status: "error"; message: string }
  | { status: "saved" }
  | undefined;

export async function updateBusinessLogo(
  _prevState: UpdateBusinessLogoState,
  formData: FormData
): Promise<UpdateBusinessLogoState> {
  const ctx = await requireUser();
  const business = await getOwnedBusiness(ctx);
  if (!business) {
    return { status: "error", message: "Business not found." };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image to upload." };
  }

  const validation = validateLogoFile(file);
  if (!validation.ok) {
    return { status: "error", message: validation.reason };
  }

  // Uploads go through the service role, same as estimate-photos — no
  // anon/authenticated storage.objects grants exist. Ownership is already
  // established above via the RLS-scoped getOwnedBusiness() call.
  const admin = createAdminClient();
  const path = buildLogoStoragePath(business.id, file, randomUUID());
  const { error: uploadError } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { status: "error", message: "Something went wrong uploading your logo. Try again." };
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);

  const { error: updateError } = await ctx.supabase
    .from("businesses")
    .update({ logo_url: publicUrl })
    .eq("id", business.id);

  if (updateError) {
    return { status: "error", message: "Something went wrong saving your logo. Try again." };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/e/${business.slug}`);
  return { status: "saved" };
}

export type DeleteAccountState = { status: "error"; message: string } | undefined;

/**
 * Permanent account deletion. Requires the contractor to be signed in and to
 * type their exact business name — a plain "are you sure?" is too easy to
 * click through for something irreversible that destroys their pricing setup
 * and their entire lead history.
 *
 * Only ever deletes the caller's own account: the user id comes from the
 * validated session and the business from getOwnedBusiness(), never from the
 * form. There is no id parameter an attacker could substitute.
 */
export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const ctx = await requireUser();
  const business = await getOwnedBusiness(ctx);

  const typed = String(formData.get("confirm_name") ?? "").trim();
  const expected = business?.name?.trim() ?? "";

  if (!expected) {
    return { status: "error", message: "Couldn't confirm your business name. Refresh and try again." };
  }
  if (typed !== expected) {
    return { status: "error", message: "That doesn't match your business name exactly. Nothing was deleted." };
  }

  try {
    await deleteAccountAndData(ctx.user.id, business?.id ?? null);
  } catch (error) {
    console.error("Account deletion failed:", error);
    return { status: "error", message: "Something went wrong deleting your account. Nothing was deleted." };
  }

  // The session's user no longer exists; clear the cookie so the browser
  // isn't left holding a token for a deleted account.
  await ctx.supabase.auth.signOut();
  redirect("/login?deleted=1");
}
