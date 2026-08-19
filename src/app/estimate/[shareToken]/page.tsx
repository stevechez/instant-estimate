import { notFound } from "next/navigation";
import { loadShareableEstimate } from "./data";
import { ContactForm } from "./contact-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/pricing/format";
import { ESTIMATE_DISCLAIMER } from "@/lib/estimate-disclaimer";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function formatEstimateLine(estimate: {
  status: string;
  low_price_cents: number | null;
  high_price_cents: number | null;
  fixed_price_cents: number | null;
}): string {
  if (estimate.status === "estimated" && estimate.low_price_cents !== null && estimate.high_price_cents !== null) {
    return `${formatMoney(estimate.low_price_cents)}–${formatMoney(estimate.high_price_cents)}`;
  }
  if (estimate.status === "fixed" && estimate.fixed_price_cents !== null) {
    return formatMoney(estimate.fixed_price_cents);
  }
  return "Quote required";
}

export default async function ShareableEstimatePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const estimate = await loadShareableEstimate(shareToken);

  if (!estimate) {
    notFound();
  }

  const brandColor =
    estimate.business.brandColor && HEX_COLOR.test(estimate.business.brandColor) ? estimate.business.brandColor : null;

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-8"
      style={brandColor ? ({ "--primary": brandColor } as React.CSSProperties) : undefined}
    >
      <div className="mb-4 text-center">
        {estimate.business.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- contractor-supplied logo URL, not a local asset
          <img src={estimate.business.logoUrl} alt={estimate.business.name} className="mx-auto mb-2 h-10" />
        )}
        <h1 className="font-heading text-xl font-medium">{estimate.business.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {estimate.status === "quote_required" ? "We'll need a closer look" : "Your estimated range"}
          </CardTitle>
          {estimate.serviceName && <CardDescription>{estimate.serviceName}</CardDescription>}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {estimate.status === "quote_required" ? (
            <p className="text-sm text-muted-foreground">
              This type of job usually needs an in-person evaluation to price accurately.
            </p>
          ) : (
            <>
              <p className="text-center text-3xl font-medium">{formatEstimateLine(estimate)}</p>
              <p className="text-sm text-muted-foreground">{ESTIMATE_DISCLAIMER}</p>
            </>
          )}

          {estimate.hasLead ? (
            <p className="text-sm text-muted-foreground">
              You&apos;ve already requested a quote for this estimate — {estimate.business.name} will be in touch soon.
            </p>
          ) : (
            <ContactForm estimateId={estimate.id} businessId={estimate.businessId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
