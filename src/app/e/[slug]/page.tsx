import { notFound } from "next/navigation";
import { loadPublicEstimateEntry } from "./data";
import { EstimateWizard } from "./estimate-wizard";
import { LegalLinks } from "@/components/legal-links";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await loadPublicEstimateEntry(slug);

  if (!entry) {
    notFound();
  }

  // Displaying the contractor's brand color is part of "the homeowner
  // should understand that the estimate experience belongs to the
  // contractor" (PRODUCT_SPEC.md Section 22) — overriding the --primary
  // CSS var here (not globally) re-colors buttons/accents to match without
  // touching any other page. Known limitation: no contrast check against
  // --primary-foreground, so a very light brand color could read poorly —
  // acceptable for V1, worth revisiting if it comes up in practice.
  const brandColor = entry.business.brand_color && HEX_COLOR.test(entry.business.brand_color)
    ? entry.business.brand_color
    : null;

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-8"
      style={brandColor ? ({ "--primary": brandColor } as React.CSSProperties) : undefined}
    >
      <EstimateWizard business={entry.business} services={entry.services} />
      {/*
        Persistent, reachable from the first screen. The notice at collection
        in the contact step explains what's gathered and why; this is the
        "conspicuously posted" policy link CalOPPA expects, and it must not
        depend on the homeowner reaching the last step to appear.
        Terms are deliberately NOT linked here — homeowners are not party to
        them (see docs/legal/README.md).
      */}
      <LegalLinks privacyOnly className="mt-6 text-center text-xs text-muted-foreground" />
    </div>
  );
}
