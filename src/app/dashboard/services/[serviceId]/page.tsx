import { notFound } from "next/navigation";
import { loadServicePricingData } from "./data";
import { PricingForm } from "./pricing-form";

export default async function ServicePricingPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;
  const data = await loadServicePricingData(serviceId);

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">{data.service.name}</h1>
        <p className="text-sm text-muted-foreground">
          Set a starting price for each variant. Everything else is optional.
        </p>
      </div>
      <PricingForm service={data.service} variants={data.variants} />
    </div>
  );
}
