/**
 * Pure logo validation/path logic (PRODUCT_SPEC.md Section 22). Deliberately
 * separate from the actual upload (which is server-only — touches the
 * storage client) so this is directly unit-testable, same pattern as
 * lib/estimate-photos/validate.ts.
 */

/** Logos are small, simple images — no reason to allow anything near the 8MB estimate-photo limit. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type LogoValidation = { ok: true } | { ok: false; reason: string };

export function validateLogoFile(file: File): LogoValidation {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, reason: "Logo must be a JPG, PNG, or WEBP image." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, reason: "Logo must be smaller than 2MB." };
  }
  return { ok: true };
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Storage object key for a logo — namespaced by business, and always a
 * fresh unique id (not the original filename) so re-uploads can't collide
 * with or accidentally overwrite an unrelated object.
 */
export function buildLogoStoragePath(businessId: string, file: File, uniqueId: string): string {
  const ext = EXTENSION_BY_MIME_TYPE[file.type] ?? "";
  return `${businessId}/${uniqueId}${ext}`;
}
