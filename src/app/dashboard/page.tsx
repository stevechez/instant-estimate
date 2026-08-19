import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding/business");
  }

  const { data: services, error } = await supabase
    .from("services")
    .select("key, name, is_active")
    .eq("business_id", business.id)
    .order("sort_order");

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">{business.name}</h1>
        <p className="text-sm text-muted-foreground">
          Leads will show up here once your widget is live.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your services</CardTitle>
          <CardDescription>
            Pricing setup for each service (and activating your widget) isn&apos;t built yet — that&apos;s
            next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services && services.length > 0 ? (
            <ul className="flex flex-col gap-2 text-sm">
              {services.map((service) => (
                <li key={service.key} className="flex items-center justify-between">
                  <span>{service.name}</span>
                  <span className="text-muted-foreground">
                    {service.is_active ? "Active" : "Pricing not configured"}
                  </span>
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
