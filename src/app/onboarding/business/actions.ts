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
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name,
      slug,
      brand_color: brandColor,
    });

    if (!error) {
      redirect("/onboarding/services");
    }

    // 23505 = unique_violation. Could be the slug or the one-business-per-owner
    // constraint; only the former is worth retrying.
    if (error.code === "23505" && error.message.includes("slug")) {
      continue;
    }

    lastError = error.message;
    break;
  }

  return {
    status: "error",
    message: lastError ?? "Something went wrong creating your business. Try again.",
  };
}
