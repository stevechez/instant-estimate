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
  // Counterpart to the deactivate-instead-of-delete path below: a service
  // that was de-selected earlier still exists, so it never appears in
  // toInsert. Re-selecting it has to turn it back on explicitly, or it
  // would sit inactive with its pricing intact but serve nothing.
  const toReselect = [...existingKeys].filter((key) => selectedKeys.has(key));

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
    // De-selecting used to DELETE the service outright, which cascaded
    // through service_variants → pricing_modifiers / pricing_add_ons /
    // pricing_quote_only_rules and nulled service_id on every historical
    // estimate. This page is reachable at any time (it's just a URL), and
    // nothing about "uncheck a box, press Continue" warns that it destroys
    // pricing work — so a contractor revisiting onboarding to add one
    // service could silently wipe another one they'd already configured.
    //
    // Now: only ever delete a service that was never priced (the genuine
    // "I changed my mind during setup" case). Anything with configured
    // pricing is deactivated instead — it stops serving estimates
    // immediately, exactly as de-selecting implies, but re-checking it
    // later brings the pricing back rather than requiring a rebuild.
    const { data: removable, error: readRemovableError } = await supabase
      .from("services")
      .select("id, service_variants(starting_price_cents)")
      .eq("business_id", business.id)
      .in("key", toRemove);

    if (readRemovableError) {
      return { status: "error", message: "Something went wrong saving your services. Try again." };
    }

    const hasPricing = (row: { service_variants: { starting_price_cents: number }[] | null }) =>
      (row.service_variants ?? []).some((variant) => variant.starting_price_cents > 0);

    const neverPriced = (removable ?? []).filter((row) => !hasPricing(row)).map((row) => row.id);
    const configured = (removable ?? []).filter(hasPricing).map((row) => row.id);

    if (neverPriced.length > 0) {
      const { error } = await supabase.from("services").delete().in("id", neverPriced);
      if (error) {
        return { status: "error", message: "Something went wrong saving your services. Try again." };
      }
    }

    if (configured.length > 0) {
      const { error } = await supabase.from("services").update({ is_active: false }).in("id", configured);
      if (error) {
        return { status: "error", message: "Something went wrong saving your services. Try again." };
      }
    }
  }

  if (toReselect.length > 0) {
    // Only re-activate what actually has pricing — activateService() refuses
    // to put an unpriced service live and this must not be a way around
    // that. An unpriced re-selection just stays inactive until the
    // contractor sets a price, which is the normal onboarding path anyway.
    const { data: reselectable, error: reselectReadError } = await supabase
      .from("services")
      .select("id, is_active, service_variants(starting_price_cents)")
      .eq("business_id", business.id)
      .in("key", toReselect);

    if (reselectReadError) {
      return { status: "error", message: "Something went wrong saving your services. Try again." };
    }

    const toTurnBackOn = (reselectable ?? [])
      .filter(
        (row) =>
          !row.is_active && (row.service_variants ?? []).some((variant) => variant.starting_price_cents > 0)
      )
      .map((row) => row.id);

    if (toTurnBackOn.length > 0) {
      const { error } = await supabase.from("services").update({ is_active: true }).in("id", toTurnBackOn);
      if (error) {
        return { status: "error", message: "Something went wrong saving your services. Try again." };
      }
    }
  }

  redirect("/dashboard");
}
