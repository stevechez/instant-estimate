import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { unwrapEmbed } from "@/lib/supabase/unwrap-embed";
import { formatMoney } from "@/lib/pricing/format";

// Same embed shape as dashboard/leads/[leadId]/data.ts's EmbeddedEstimateRow,
// trimmed to just what this list needs (service name + a price line) rather
// than importing that route's full detail type.
interface EmbeddedEstimateRow {
  status: string;
  low_price_cents: number | null;
  high_price_cents: number | null;
  fixed_price_cents: number | null;
  services: { name: string } | { name: string }[] | null;
}

// Same logic as dashboard/leads/[leadId]/page.tsx's formatEstimateLine —
// duplicated rather than extracted into a shared helper, since that page
// already has its own richer version and this one only needs to run
// against the trimmer row shape above; not a Gate 4 concern to unify them.
function formatEstimateLine(estimate: EmbeddedEstimateRow | null): string {
  if (!estimate) return "Quote required";
  if (estimate.status === "estimated" && estimate.low_price_cents !== null && estimate.high_price_cents !== null) {
    return `${formatMoney(estimate.low_price_cents)}–${formatMoney(estimate.high_price_cents)}`;
  }
  if (estimate.status === "fixed" && estimate.fixed_price_cents !== null) {
    return formatMoney(estimate.fixed_price_cents);
  }
  return "Quote required";
}

export default async function DashboardPage() {
  const ctx = await requireUser();
  const { supabase } = ctx;
  const business = await getOwnedBusiness(ctx);

  if (!business) {
    redirect("/onboarding/business");
  }

  const { data: services, error } = await supabase
    .from("services")
    .select("id, key, name, is_active")
    .eq("business_id", business.id)
    .order("sort_order");

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select(
      "id, name, status, created_at, estimates(status, low_price_cents, high_price_cents, fixed_price_cents, services(name))"
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (leadsError) {
    throw new Error(`Failed to load leads: ${leadsError.message}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">{business.name}</h1>
        <p className="text-sm text-muted-foreground">Recent leads and service pricing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent leads</CardTitle>
          <CardDescription>Homeowner requests from your Instant Estimate widget.</CardDescription>
        </CardHeader>
        <CardContent>
          {leads && leads.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm">
              {leads.map((lead) => {
                const estimateRow = unwrapEmbed(
                  lead.estimates as unknown as EmbeddedEstimateRow | EmbeddedEstimateRow[] | null
                );
                const serviceName = unwrapEmbed(estimateRow?.services ?? null)?.name ?? null;

                return (
                  <li key={lead.id}>
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="-mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-1.5 hover:bg-muted"
                    >
                      <span className="flex flex-col">
                        <span>{lead.name}</span>
                        <span className="text-xs text-muted-foreground">{serviceName ?? "Unspecified service"}</span>
                      </span>
                      <span className="flex flex-col items-end text-muted-foreground">
                        <span>{formatEstimateLine(estimateRow)}</span>
                        <span className="text-xs">
                          {lead.status} · {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your services</CardTitle>
          <CardDescription>Set a price for each service, then activate it to go live.</CardDescription>
        </CardHeader>
        <CardContent>
          {services && services.length > 0 ? (
            <ul className="flex flex-col gap-2 text-sm">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/dashboard/services/${service.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 hover:bg-muted"
                  >
                    <span>{service.name}</span>
                    <span className="text-muted-foreground">
                      {service.is_active ? "Active" : "Pricing not configured"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No services selected yet.</p>
          )}
          <Button render={<Link href="/onboarding/services" />} variant="outline" className="mt-4">
            Edit services
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
