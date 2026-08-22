import Link from "next/link";

import { Button } from "@/components/ui/button";
import { LegalLinks } from "@/components/legal-links";

// Marketing site shell — just the header/footer chrome around "/". Kept out
// of dashboard/, onboarding/, and (auth)/, which each have their own
// purpose-built layout (see src/app/dashboard/layout.tsx etc.).
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-heading text-sm font-medium">
            Instant Estimate
          </Link>
          <nav className="flex items-center gap-2">
            <Button render={<Link href="/login" />} variant="ghost" size="sm">
              Log in
            </Button>
            <Button render={<Link href="/signup" />} size="sm">
              Get started
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6">
          <span className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Instant Estimate
          </span>
          <LegalLinks className="text-xs text-muted-foreground" />
        </div>
      </footer>
    </div>
  );
}
