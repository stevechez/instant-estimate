import Link from "next/link";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/meta";

/**
 * Shared shell for /privacy and /terms. Public and unauthenticated by design —
 * a privacy policy behind a login is not "conspicuously posted" in any
 * meaningful sense, and homeowners who never have an account need to read it.
 *
 * Prose styling lives here rather than in each page so the two documents
 * cannot drift apart visually.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="font-heading text-sm font-medium">
            Instant Estimate
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
        <article
          className={[
            "text-[15px] leading-relaxed text-foreground",
            "[&_h1]:font-heading [&_h1]:text-3xl [&_h1]:font-medium [&_h1]:tracking-tight",
            "[&_h2]:font-heading [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:scroll-mt-20",
            "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-medium",
            "[&_p]:my-3",
            "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
            "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
            "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
            "[&_strong]:font-medium",
            "[&_hr]:my-8 [&_hr]:border-border",
            // Tables carry the service-provider list; they must scroll rather
            // than force the page sideways on a phone.
            "[&_.table-scroll]:my-4 [&_.table-scroll]:overflow-x-auto",
            "[&_table]:w-full [&_table]:min-w-[28rem] [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm",
            "[&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:font-medium",
            "[&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top",
          ].join(" ")}
        >
          {children}
        </article>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 text-sm text-muted-foreground">
          Last updated {LEGAL_EFFECTIVE_DATE}.
        </div>
      </footer>
    </div>
  );
}
