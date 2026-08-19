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
