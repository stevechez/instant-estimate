import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * The Data Access Layer for the contractor side of the app: every protected
 * Server Component / Server Action should go through this rather than
 * calling supabase.auth directly, so the "is there a real, verified user"
 * check happens in exactly one place. Uses getUser() (validates the JWT
 * against the auth server), not getSession() (only decodes the cookie) —
 * this is the "Secure" check, not the "Optimistic" one proxy.ts does.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { user, supabase };
}

export interface OwnedBusiness {
  id: string;
  name: string;
  slug: string;
  brand_color: string | null;
  logo_url: string | null;
  is_active: boolean;
}

/** V1 assumes one business per contractor account (PRODUCT_SPEC.md doesn't ask for multi-business support). */
export async function getOwnedBusiness(): Promise<OwnedBusiness | null> {
  const { user, supabase } = await requireUser();

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name, slug, brand_color, logo_url, is_active")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load business: ${error.message}`);
  }

  return data;
}

export interface OwnedService {
  id: string;
  business_id: string;
  key: string;
  name: string;
  is_active: boolean;
}

/**
 * A service scoped to the caller's own business, or null if it doesn't
 * exist or belongs to someone else. RLS already prevents cross-tenant
 * reads (see supabase/migrations); the explicit business_id match here is
 * just what makes "not found" and "not yours" collapse into the same,
 * unambiguous null rather than leaking which case it was.
 */
export async function getOwnedService(serviceId: string): Promise<OwnedService | null> {
  const business = await getOwnedBusiness();
  if (!business) return null;

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("services")
    .select("id, business_id, key, name, is_active")
    .eq("id", serviceId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load service: ${error.message}`);
  }

  return data;
}
