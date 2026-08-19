"use server";

import { revalidatePath } from "next/cache";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";

export type UpdateLeadStatusState = { status: "error"; message: string } | undefined;

const VALID_STATUSES = ["new", "contacted", "won", "lost"] as const;

export async function updateLeadStatus(
  leadId: string,
  _prevState: UpdateLeadStatusState,
  formData: FormData
): Promise<UpdateLeadStatusState> {
  const ctx = await requireUser();
  const business = await getOwnedBusiness(ctx);
  if (!business) {
    return { status: "error", message: "Lead not found." };
  }

  const newStatus = String(formData.get("status"));
  if (!VALID_STATUSES.includes(newStatus as (typeof VALID_STATUSES)[number])) {
    return { status: "error", message: "Invalid status." };
  }

  const { error } = await ctx.supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId)
    .eq("business_id", business.id);

  if (error) {
    return { status: "error", message: "Something went wrong updating this lead. Try again." };
  }

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard");
}
