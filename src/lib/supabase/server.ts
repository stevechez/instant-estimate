import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers, bound to the caller's session via cookies. Still uses the
 * anon key and is still subject to RLS — this is for the authenticated
 * contractor, not for privileged server-only operations.
 *
 * Must be created fresh per request (cookies() is request-scoped), so this
 * is a factory, not a singleton.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies can't be
            // written. Harmless as long as proxy.ts is refreshing the
            // session on every request (see proxy.ts).
          }
        },
      },
    }
  );
}
