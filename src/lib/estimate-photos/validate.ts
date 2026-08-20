/**
 * Pure homeowner-photo validation/path logic (PRODUCT_SPEC.md Section 10).
 * Deliberately separate from upload.ts (which is server-only — touches the
 * storage client) so this is directly unit-testable, same pattern as
 * lib/sms/message.ts and lib/phone.ts.
 */

/** "Up to three photos" — see estimate_photos_max_three DB trigger, which enforces this too. */
export const MAX_ESTIMATE_PHOTOS = 3;

/** Generous enough for a phone camera photo, small enough to keep uploads fast on a homeowner's connection. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export interface RejectedPhoto {
  name: string;
  reason: string;
}

export interface PhotoSelection {
  /** In submission order, capped at MAX_ESTIMATE_PHOTOS. */
  valid: File[];
  rejected: RejectedPhoto[];
}

/**
 * Filters a raw file list down to what's actually uploadable. Best-effort by
 * design (Section 10: photos are supporting evidence, not a blocking
 * requirement) — invalid files are dropped with a reason, never thrown.
 */
export function selectValidPhotos(files: File[]): PhotoSelection {
  const valid: File[] = [];
  const rejected: RejectedPhoto[] = [];

  for (const file of files) {
    // A <input type="file" multiple> with nothing chosen in one of its
    // slots (or an empty FormData entry) shows up as a zero-byte file —
    // not a real rejection, just nothing to do.
    if (!file || file.size === 0) continue;

    if (valid.length >= MAX_ESTIMATE_PHOTOS) {
      rejected.push({ name: file.name, reason: `Only ${MAX_ESTIMATE_PHOTOS} photos are allowed.` });
      continue;
    }
    if (!file.type.startsWith("image/")) {
      rejected.push({ name: file.name, reason: "Only image files are allowed." });
      continue;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      rejected.push({ name: file.name, reason: "Photo is too large (max 8MB)." });
      continue;
    }

    valid.push(file);
  }

  return { valid, rejected };
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/gif": ".gif",
};

/** Storage object key for a photo — namespaced by estimate so estimate_photos.storage_path stays traceable. */
export function buildPhotoStoragePath(estimateId: string, file: File, uniqueId: string): string {
  const extFromName = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0]?.toLowerCase();
  const ext = extFromName ?? EXTENSION_BY_MIME_TYPE[file.type] ?? "";
  return `${estimateId}/${uniqueId}${ext}`;
}
