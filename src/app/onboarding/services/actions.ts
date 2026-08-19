"use server";

import { redirect } from "next/navigation";
import { requireUser, getOwnedBusiness } from "@/lib/auth/dal";
import { DEFAULT_VARIANTS, PLUMBING_SERVICE_CATALOG } from "@/lib/plumbing-services";

export type ServiceSelectionFormState = { status: "error"; message: string } | undefined;

export async function saveServiceSelection(
  _prevState: ServiceSelectionFormState,
  formData: FormData
): Promise<ServiceSelectionFormState> {
  const ctx = await requireUser();
  const { supabase } = ctx;
  const business = await getOwnedBusiness(ctx);

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
    const { data: insertedServices, error } = await supabase
      .from("services")
      .insert(
        toInsert.map((s, index) => ({
          business_id: business.id,
          key: s.key,
          name: s.name,
          // Offset by how many services already exist so re-adding a
          // service after removing others doesn't collide with/interleave
          // existing sort_order values.
          sort_order: existingKeys.size + index,
          is_active: false, // activation happens once pricing is configured — not part of this step
        }))
      )
      .select("id, key");
    if (error) {
      return { status: "error", message: "Something went wrong saving your services. Try again." };
    }

    // Every service gets its default variant(s) up front (e.g. Repair /
    // Replacement) — see DEFAULT_VARIANTS. Contractors price them on the
    // pricing setup page; they don't author variant structure themselves in V1.
    const variantRows = (insertedServices ?? []).flatMap((service) =>
      (DEFAULT_VARIANTS[service.key] ?? []).map((variant, index) => ({
        service_id: service.id,
        key: variant.key,
        name: variant.name,
        starting_price_cents: 0,
        sort_order: index,
        is_active: false,
      }))
    );
    if (variantRows.length > 0) {
      const { error: variantError } = await supabase.from("service_variants").insert(variantRows);
      if (variantError) {
        return { status: "error", message: "Something went wrong saving your services. Try again." };
      }
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
