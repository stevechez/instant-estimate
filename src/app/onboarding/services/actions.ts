"use server";

import { redirect } from "next/navigation";
import { requireUser, getOwnedBusiness } from "@/lib/auth/dal";
import { PLUMBING_SERVICE_CATALOG } from "@/lib/plumbing-services";

export type ServiceSelectionFormState = { status: "error"; message: string } | undefined;

export async function saveServiceSelection(
  _prevState: ServiceSelectionFormState,
  formData: FormData
): Promise<ServiceSelectionFormState> {
  const { supabase } = await requireUser();
  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding/business");
  }

  const selectedKeys = new Set(formData.getAll("services").map(String));
  const validKeys = new Set(PLUMBING_SERVICE_CATALOG.map((s) => s.key));
  const chosen = PLUMBING_SERVICE_CATALOG.filter((s) => selectedKeys.has(s.key) && validKeys.has(s.key));

  if (chosen.length === 0) {
    return { status: "error", message: "Select at least one service to offer." };
  }

  const { data: existing, error: readError } = await supabase
    .from("services")
    .select("key")
    .eq("business_id", business.id);

  if (readError) {
    return { status: "error", message: "Something went wrong. Try again." };
  }

  const existingKeys = new Set((existing ?? []).map((row) => row.key));
  const toInsert = chosen.filter((s) => !existingKeys.has(s.key));
  const toRemove = [...existingKeys].filter((key) => !selectedKeys.has(key));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("services").insert(
      toInsert.map((s, index) => ({
        business_id: business.id,
        key: s.key,
        name: s.name,
        sort_order: index,
        is_active: false, // activation happens once pricing is configured — not part of this step
      }))
    );
    if (error) {
      return { status: "error", message: "Something went wrong saving your services. Try again." };
    }
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("business_id", business.id)
      .in("key", toRemove);
    if (error) {
      return { status: "error", message: "Something went wrong saving your services. Try again." };
    }
  }

  redirect("/dashboard");
}
