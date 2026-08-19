import { redirect } from "next/navigation";
import { getOwnedBusiness } from "@/lib/auth/dal";
import { BusinessForm } from "./business-form";

export default async function OnboardingBusinessPage() {
  const business = await getOwnedBusiness();

  // One business per contractor (see dal.ts) — if it already exists, this
  // step is done.
  if (business) {
    redirect("/onboarding/services");
  }

  return <BusinessForm />;
}
