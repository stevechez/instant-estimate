import Link from "next/link";

/**
 * Privacy/Terms links. CalOPPA requires the privacy policy to be
 * conspicuously posted, so these belong anywhere a user can reach the
 * product — including the pages a homeowner sees, who never signs in.
 */
export function LegalLinks({
  className,
  privacyOnly = false,
}: {
  className?: string;
  /** Homeowner-facing surfaces: they are not party to the Terms, so linking them there would imply otherwise. */
  privacyOnly?: boolean;
}) {
  return (
    <p className={className ?? "text-center text-xs text-muted-foreground"}>
      <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
        Privacy Policy
      </Link>
      {!privacyOnly && (
        <>
          {" · "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>
        </>
      )}
    </p>
  );
}
