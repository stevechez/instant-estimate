import { redirect } from "next/navigation";
import { getOwnedBusiness, requireUser } from "@/lib/auth/dal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";

export default async function WidgetInstallPage() {
  await requireUser();
  const business = await getOwnedBusiness();

  if (!business) {
    redirect("/onboarding/business");
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const shareableLink = `${appUrl}/e/${business.slug}`;
  const embedSnippet = `<script src="${appUrl}/embed.js" data-business="${business.slug}" async></script>`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium">Install your widget</h1>
        <p className="text-sm text-muted-foreground">
          Two ways homeowners can reach your Instant Estimate — use either or both.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shareable link</CardTitle>
          <CardDescription>
            Send this directly — texts, emails, your Google Business Profile, anywhere.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <code className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">{shareableLink}</code>
          <CopyButton text={shareableLink} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed on your website</CardTitle>
          <CardDescription>
            Paste this once, right before the closing <code>&lt;/body&gt;</code> tag on your site. It adds a
            floating &quot;Get an Instant Estimate&quot; button — no other changes needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
            <code>{embedSnippet}</code>
          </pre>
          <CopyButton text={embedSnippet} label="Copy snippet" />
        </CardContent>
      </Card>
    </div>
  );
}
