import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS entirely — server-only, never
 * imported from a Client Component. This is what the homeowner-facing
 * estimate/lead routes use (see supabase/migrations: estimates and leads
 * have no anon insert policy by design), not the contractor dashboard.
 *
 * No session/cookies involved, so a single shared client is fine here
 * (unlike the request-scoped client in server.ts).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
