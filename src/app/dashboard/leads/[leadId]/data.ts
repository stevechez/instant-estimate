import "server-only";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { unwrapEmbed } from "@/lib/supabase/unwrap-embed";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSignedEstimatePhotoUrls } from "@/lib/estimate-photos/signed-urls";

interface EmbeddedEstimateRow {
  share_token: string;
  status: string;
  low_price_cents: number | null;
  high_price_cents: number | null;
  fixed_price_cents: number | null;
  urgency: string | null;
  homeowner_description: string | null;
  service_address: string | null;
  breakdown: { key: string; label: string; amountCents: number }[] | null;
  services: { name: string } | { name: string }[] | null;
  estimate_photos: { storage_path: string }[] | null;
}

export interface LeadDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferred_contact_method: string | null;
  preferred_service_timing: string | null;
  status: "new" | "contacted" | "won" | "lost";
  notified_at: string | null;
  created_at: string;
  estimate: {
    shareToken: string;
    status: string;
    low_price_cents: number | null;
    high_price_cents: number | null;
    fixed_price_cents: number | null;
    urgency: string | null;
    homeowner_description: string | null;
    service_address: string | null;
    breakdown: { key: string; label: string; amountCents: number }[] | null;
    serviceName: string | null;
    photoUrls: string[];
  } | null;
}

export async function loadOwnedLead(leadId: string): Promise<LeadDetail | null> {
  const ctx = await requireUser();
  const business = await getOwnedBusiness(ctx);
  if (!business) return null;

  const { supabase } = ctx;
  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      "id, name, phone, email, preferred_contact_method, preferred_service_timing, status, notified_at, created_at, estimates(share_token, status, low_price_cents, high_price_cents, fixed_price_cents, urgency, homeowner_description, service_address, breakdown, services(name), estimate_photos(storage_path))"
    )
    .eq("id", leadId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error || !lead) return null;

  const estimateRow = unwrapEmbed(lead.estimates as unknown as EmbeddedEstimateRow | EmbeddedEstimateRow[] | null);

  // Ownership is already established above (RLS-scoped query, joined through
  // business.id); the admin client here is only to generate signed URLs for
  // a private bucket, not to re-check authorization.
  const photoUrls = estimateRow?.estimate_photos?.length
    ? await getSignedEstimatePhotoUrls(
        createAdminClient(),
        estimateRow.estimate_photos.map((p) => p.storage_path)
      )
    : [];

  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    preferred_contact_method: lead.preferred_contact_method,
    preferred_service_timing: lead.preferred_service_timing,
    status: lead.status as LeadDetail["status"],
    notified_at: lead.notified_at,
    created_at: lead.created_at,
    estimate: estimateRow
      ? {
          shareToken: estimateRow.share_token,
          status: estimateRow.status,
          low_price_cents: estimateRow.low_price_cents,
          high_price_cents: estimateRow.high_price_cents,
          fixed_price_cents: estimateRow.fixed_price_cents,
          urgency: estimateRow.urgency,
          homeowner_description: estimateRow.homeowner_description,
          service_address: estimateRow.service_address,
          breakdown: estimateRow.breakdown,
          serviceName: unwrapEmbed(estimateRow.services)?.name ?? null,
          photoUrls,
        }
      : null,
  };
}
