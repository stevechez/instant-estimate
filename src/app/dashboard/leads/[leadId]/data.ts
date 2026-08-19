import "server-only";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";

/** PostgREST embeds a to-one FK relation as either an object or a single-element array depending on how the relationship was inferred — normalize rather than assume. */
function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface EmbeddedEstimateRow {
  status: string;
  low_price_cents: number | null;
  high_price_cents: number | null;
  fixed_price_cents: number | null;
  urgency: string | null;
  homeowner_description: string | null;
  service_address: string | null;
  breakdown: { key: string; label: string; amountCents: number }[] | null;
  services: { name: string } | { name: string }[] | null;
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
    status: string;
    low_price_cents: number | null;
    high_price_cents: number | null;
    fixed_price_cents: number | null;
    urgency: string | null;
    homeowner_description: string | null;
    service_address: string | null;
    breakdown: { key: string; label: string; amountCents: number }[] | null;
    serviceName: string | null;
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
      "id, name, phone, email, preferred_contact_method, preferred_service_timing, status, notified_at, created_at, estimates(status, low_price_cents, high_price_cents, fixed_price_cents, urgency, homeowner_description, service_address, breakdown, services(name))"
    )
    .eq("id", leadId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error || !lead) return null;

  const estimateRow = unwrapOne(lead.estimates as unknown as EmbeddedEstimateRow | EmbeddedEstimateRow[] | null);

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
          status: estimateRow.status,
          low_price_cents: estimateRow.low_price_cents,
          high_price_cents: estimateRow.high_price_cents,
          fixed_price_cents: estimateRow.fixed_price_cents,
          urgency: estimateRow.urgency,
          homeowner_description: estimateRow.homeowner_description,
          service_address: estimateRow.service_address,
          breakdown: estimateRow.breakdown,
          serviceName: unwrapOne(estimateRow.services)?.name ?? null,
        }
      : null,
  };
}
