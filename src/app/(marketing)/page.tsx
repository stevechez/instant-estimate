import { redirect } from "next/navigation";

// No marketing/landing page is in scope yet (PRODUCT_SPEC.md doesn't define
// one for the MVP) — send visitors straight into the contractor auth flow.
// proxy.ts takes it from there (bounces to /dashboard if already logged in).
export default function Home() {
  redirect("/login");
}
