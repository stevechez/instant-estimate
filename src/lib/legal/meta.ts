/**
 * Single source of truth for the identity and dates that appear in the legal
 * pages, so the two documents can never drift from each other or from what
 * the app tells users elsewhere.
 */
export const LEGAL_OPERATOR = "Steve Maciaszek";
export const LEGAL_CONTACT_EMAIL = "stevechez@gmail.com";
export const LEGAL_GOVERNING_STATE = "California";
/** Bump both of these together whenever either document changes materially. */
export const LEGAL_EFFECTIVE_DATE = "August 22, 2026";
