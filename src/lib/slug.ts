/** Converts a business name into a URL-safe slug, e.g. "Steve's Plumbing Co." -> "steve-s-plumbing-co". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents left by NFKD normalization
    .replace(/[^a-z0-9]+/g, "-")
    // Trim dashes AFTER truncating, not before: slicing a longer string can
    // cut right after an interior dash, which would otherwise re-introduce
    // a trailing dash that never gets trimmed.
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}
