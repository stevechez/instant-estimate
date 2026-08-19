import { redirect } from "next/navigation";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { ServiceSelectionForm } from "./service-selection-form";

export default async function OnboardingServicesPage() {
  const ctx = await requireUser();
  const { supabase } = ctx;
  const business = await getOwnedBusiness(ctx);

  if (!business) {
    redirect("/onboarding/business");
  }

  const { data: existingServices, error } = await supabase
    .from("services")
    .select("key")
    .eq("business_id", business.id);

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return (
    <ServiceSelectionForm initiallySelectedKeys={(existingServices ?? []).map((row) => row.key)} />
  );
}
