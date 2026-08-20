"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { slugify } from "@/lib/slug";

export type BusinessFormState = { status: "error"; message: string } | undefined;

const DEFAULT_BRAND_COLOR = "#0f172a";
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function createBusiness(
  _prevState: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const { user, supabase } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const brandColorRaw = String(formData.get("brand_color") ?? "").trim();

  if (name.length < 2) {
    return { status: "error", message: "Enter your business name." };
  }

  const brandColor = HEX_COLOR.test(brandColorRaw) ? brandColorRaw : DEFAULT_BRAND_COLOR;
  const baseSlug = slugify(name) || "business";

  // Slugs must be unique (supabase/migrations: businesses.slug is unique).
  // Retry with a numeric suffix on collision rather than surfacing a "slug
  // taken" error the contractor never chose or sees.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name,
      slug,
      brand_color: brandColor,
      // Explicit rather than relying on the column default: is_active is the
      // suspend switch the public loaders filter on, so a business that
      // silently defaulted to false would be invisible with no indication
      // why. See supabase/migrations/20260820160000_activate_businesses.sql.
      is_active: true,
    });

    if (!error) {
      redirect("/onboarding/services");
    }

    // 23505 = unique_violation. Could be the slug or the one-business-per-owner
    // constraint; only the former is worth retrying.
    if (error.code === "23505" && error.message.includes("slug")) {
      continue;
    }

    // Never surface error.message here — it's a raw Postgres error (e.g.
    // 'duplicate key value violates unique constraint "businesses_owner_id_key"'
    // from a double-submitted form racing the one-business-per-owner
    // constraint) and not something a contractor should see.
    break;
  }

  return {
    status: "error",
    message: "Something went wrong creating your business. Try again.",
  };
}
