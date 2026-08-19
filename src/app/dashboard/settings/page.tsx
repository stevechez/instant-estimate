import { redirect } from "next/navigation";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { NotificationPhoneForm } from "./notification-phone-form";

export default async function SettingsPage() {
  await requireUser();
  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding/business");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Settings</h1>
      </div>
      <NotificationPhoneForm currentPhone={business.notification_phone ?? ""} />
    </div>
  );
}
