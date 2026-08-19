/** PostgREST embeds a to-one FK relation as either an object or a single-element array depending on how the relationship was inferred — normalize rather than assume which one you'll get. */
export function unwrapEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
