"use server";

import { revalidatePath } from "next/cache";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { normalizePhoneToE164 } from "@/lib/phone";

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
    .update({ notification_phone: normalized })
    .eq("id", business.id);

  if (error) {
    return { status: "error", message: "Something went wrong saving your settings. Try again." };
  }

  revalidatePath("/dashboard/settings");
  return { status: "saved" };
}
