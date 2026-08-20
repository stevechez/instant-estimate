import { LegalLinks } from "@/components/legal-links";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {children}
        <LegalLinks />
      </div>
    </div>
  );
}
