import { notFound } from "next/navigation";
import { loadPublicEstimateEntry } from "./data";
import { EstimateWizard } from "./estimate-wizard";

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-8">
      <EstimateWizard business={entry.business} services={entry.services} />
    </div>
  );
}
