import { notFound } from "next/navigation";
import { loadOwnedLead } from "./data";
import { StatusControl } from "./status-control";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { formatMoney } from "@/lib/pricing/format";

function formatEstimateLine(estimate: NonNullable<Awaited<ReturnType<typeof loadOwnedLead>>>["estimate"]): string {
  if (!estimate) return "Quote required";
  if (estimate.status === "estimated" && estimate.low_price_cents !== null && estimate.high_price_cents !== null) {
    return `${formatMoney(estimate.low_price_cents)}–${formatMoney(estimate.high_price_cents)}`;
  }
  if (estimate.status === "fixed" && estimate.fixed_price_cents !== null) {
    return formatMoney(estimate.fixed_price_cents);
  }
  return "Quote required";
}

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const lead = await loadOwnedLead(leadId);

  if (!lead) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">{lead.name}</h1>
        <p className="text-sm text-muted-foreground">
          Submitted {new Date(lead.created_at).toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusControl leadId={lead.id} currentStatus={lead.status} />
        </CardContent>
      </Card>

      {lead.estimate && (
        <Card>
          <CardHeader>
            <CardTitle>Shareable link</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Send this to the homeowner to let them view this estimate again.</span>
            <CopyButton
              text={`${process.env.APP_URL ?? "http://localhost:3000"}/estimate/${lead.estimate.shareToken}`}
              label="Copy link"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>Phone: {lead.phone}</p>
          {lead.email && <p>Email: {lead.email}</p>}
          {lead.estimate?.service_address && <p>Address: {lead.estimate.service_address}</p>}
          {lead.preferred_contact_method && <p>Preferred contact: {lead.preferred_contact_method}</p>}
          {lead.preferred_service_timing && <p>Preferred timing: {lead.preferred_service_timing}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estimate</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-2xl font-medium">{formatEstimateLine(lead.estimate)}</p>
          {lead.estimate?.urgency && <p className="text-muted-foreground">Urgency: {lead.estimate.urgency}</p>}
          {lead.estimate?.homeowner_description && (
            <div>
              <p className="font-medium">Homeowner&apos;s description</p>
              <p className="text-muted-foreground">{lead.estimate.homeowner_description}</p>
            </div>
          )}
          {lead.estimate?.breakdown && lead.estimate.breakdown.length > 0 && (
            <div>
              <p className="font-medium">Breakdown</p>
              <ul className="text-muted-foreground">
                {lead.estimate.breakdown.map((line) => (
                  <li key={line.key}>
                    {line.label}: +{formatMoney(line.amountCents)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
