import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/legal-links";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <span className="font-heading text-sm font-medium">Instant Estimate — Setup</span>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Log out
          </Button>
        </form>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
      <footer className="border-t bg-background px-6 py-4">
        <LegalLinks />
      </footer>
    </div>
  );
}
