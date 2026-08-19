import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * All reads here go through the service-role client, not the anon key —
 * there are no anon RLS policies on any of these tables by design (see
 * supabase/migrations' architecture notes). The homeowner-facing widget is
 * public and unauthenticated, so these functions are the authorization
 * boundary: every query is scoped to is_active = true so nothing
 * half-configured or deactivated is ever reachable from here.
 */

export interface PublicBusiness {
  id: string;
  name: string;
  slug: string;
  brand_color: string | null;
  logo_url: string | null;
}

export interface PublicServiceOption {
  id: string;
  key: string;
  name: string;
}

/**
 * The business + its active services, or null if the slug doesn't resolve
 * to a business with anything to offer. Both cases (no such business, or a
 * business with zero active services) render identically to the homeowner —
 * deliberately not distinguished, to avoid leaking which slugs exist.
 */
export async function loadPublicEstimateEntry(
  slug: string
): Promise<{ business: PublicBusiness; services: PublicServiceOption[] } | null> {
  const supabase = createAdminClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug, brand_color, logo_url")
    .eq("slug", slug)
    .maybeSingle();

  if (businessError || !business) return null;

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, key, name")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("sort_order");

  if (servicesError || !services || services.length === 0) return null;

  return { business, services };
}

export interface VariantModifierForEstimate {
  key: string;
  name: string;
  amount_cents: number;
  condition_question_key: string;
  condition_equals: string;
}

export interface VariantAddOnForEstimate {
  key: string;
  name: string;
  amount_cents: number;
}

export interface VariantForEstimate {
  id: string;
  key: string;
  name: string;
  pricing_mode: "ranged" | "fixed";
  starting_price_cents: number;
  minimum_price_cents: number | null;
  modifiers: VariantModifierForEstimate[];
  add_ons: VariantAddOnForEstimate[];
}

/** Active services for a business, keyed by business id rather than slug — used mid-flow once the slug has already been resolved once (e.g. classification). */
export async function loadActiveServicesForBusiness(businessId: string): Promise<PublicServiceOption[]> {
  const supabase = createAdminClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, key, name")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("sort_order");

  return services ?? [];
}

/** Active variants for an active service belonging to this business — the options a homeowner can pick between (e.g. Repair vs Replacement). */
export async function loadActiveVariantOptions(
  businessId: string,
  serviceId: string
): Promise<{ id: string; key: string; name: string }[]> {
  const supabase = createAdminClient();

  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) return [];

  const { data: variants } = await supabase
    .from("service_variants")
    .select("id, key, name")
    .eq("service_id", serviceId)
    .eq("is_active", true)
    .order("sort_order");

  return variants ?? [];
}

/** Full pricing config for one variant — used both to decide which questions to ask and to actually calculate the estimate. Null if the variant/service/business chain doesn't check out or isn't active. */
export async function loadVariantForEstimate(
  businessId: string,
  serviceId: string,
  variantId: string
): Promise<VariantForEstimate | null> {
  const supabase = createAdminClient();

  const [{ data: service }, { data: variant }] = await Promise.all([
    supabase
      .from("services")
      .select("id")
      .eq("id", serviceId)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("service_variants")
      .select("id, key, name, pricing_mode, starting_price_cents, minimum_price_cents")
      .eq("id", variantId)
      .eq("service_id", serviceId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (!service || !variant) return null;

  const [{ data: modifiers }, { data: addOns }] = await Promise.all([
    supabase
      .from("pricing_modifiers")
      .select("key, name, amount_cents, condition_question_key, condition_equals")
      .eq("service_variant_id", variantId)
      .eq("is_active", true),
    supabase
      .from("pricing_add_ons")
      .select("key, name, amount_cents")
      .eq("service_variant_id", variantId)
      .eq("is_active", true),
  ]);

  return {
    id: variant.id,
    key: variant.key,
    name: variant.name,
    pricing_mode: variant.pricing_mode,
    starting_price_cents: variant.starting_price_cents,
    minimum_price_cents: variant.minimum_price_cents,
    modifiers: modifiers ?? [],
    add_ons: addOns ?? [],
  };
}
