import Link from "next/link";
import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b bg-background px-6 py-4">
        <span className="font-heading text-sm font-medium">Instant Estimate</span>
        <div className="flex items-center gap-2">
          <Button render={<Link href="/dashboard/widget" />} variant="ghost" size="sm">
            Get widget code
          </Button>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 justify-center px-4 py-12">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
