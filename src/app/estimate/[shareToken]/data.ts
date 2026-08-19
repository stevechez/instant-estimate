import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { unwrapEmbed } from "@/lib/supabase/unwrap-embed";

interface EmbeddedBusinessRow {
  name: string;
  brand_color: string | null;
  logo_url: string | null;
  slug: string;
}

interface EmbeddedServiceRow {
  name: string;
}

export interface ShareableEstimate {
  id: string;
  businessId: string;
  status: string;
  low_price_cents: number | null;
  high_price_cents: number | null;
  fixed_price_cents: number | null;
  urgency: string | null;
  homeowner_description: string | null;
  breakdown: { key: string; label: string; amountCents: number }[] | null;
  serviceName: string | null;
  business: { name: string; brandColor: string | null; logoUrl: string | null; slug: string };
  /** Whether a lead already exists for this estimate — governs whether the contact form is shown again (PRODUCT_SPEC.md Section 20: a simple entry point, not a full portal). */
  hasLead: boolean;
}

/**
 * Resolves a previously-generated estimate by its share_token — the
 * shareable-estimate entry point (PRODUCT_SPEC.md Section 20). Public and
 * unauthenticated, same as the rest of the widget: service-role reads only,
 * no anon table access.
 */
export async function loadShareableEstimate(shareToken: string): Promise<ShareableEstimate | null> {
  const supabase = createAdminClient();

  const { data: estimate, error } = await supabase
    .from("estimates")
    .select(
      "id, business_id, status, low_price_cents, high_price_cents, fixed_price_cents, urgency, homeowner_description, breakdown, businesses(name, brand_color, logo_url, slug), services(name)"
    )
    .eq("share_token", shareToken)
    .maybeSingle();

  if (error || !estimate) return null;

  const business = unwrapEmbed(
    estimate.businesses as unknown as EmbeddedBusinessRow | EmbeddedBusinessRow[] | null
  );
  if (!business) return null;

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("estimate_id", estimate.id);

  return {
    id: estimate.id,
    businessId: estimate.business_id,
    status: estimate.status,
    low_price_cents: estimate.low_price_cents,
    high_price_cents: estimate.high_price_cents,
    fixed_price_cents: estimate.fixed_price_cents,
    urgency: estimate.urgency,
    homeowner_description: estimate.homeowner_description,
    breakdown: estimate.breakdown,
    serviceName: unwrapEmbed(estimate.services as unknown as EmbeddedServiceRow | EmbeddedServiceRow[] | null)?.name ?? null,
    business: {
      name: business.name,
      brandColor: business.brand_color,
      logoUrl: business.logo_url,
      slug: business.slug,
    },
    hasLead: (count ?? 0) > 0,
  };
}
