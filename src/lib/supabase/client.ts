import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon key, so it's bound by RLS
 * (see supabase/migrations — every table is owner-only). This is what
 * contractor dashboard/onboarding client components use for their own
 * authenticated session; the public homeowner widget never uses this.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
