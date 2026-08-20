/**
 * Per-endpoint rate limits for the public estimate widget. Deliberately
 * generous — these exist to stop abuse (scripted hammering, cost-running-up),
 * not to constrain a real homeowner who redescribes their problem a few
 * times or double-checks their estimate.
 */
export const RATE_LIMITS = {
  /** classifyDescription — calls the Anthropic API, the one real per-request cost. */
  classify: { windowSeconds: 600, limit: 20 },
  /** submitEstimate / submitUnmatchedEstimate — share a bucket, they're mutually exclusive branches of the same step. */
  submitEstimate: { windowSeconds: 600, limit: 20 },
  /** submitLead — triggers email/SMS sends and creates a real lead a contractor sees; stricter. */
  submitLead: { windowSeconds: 600, limit: 5 },
  /**
   * Leads per *business* per hour, regardless of who is sending them.
   *
   * The per-IP limits above assume caller identity can't be forged, which is
   * only true behind an edge that overwrites the IP headers (see
   * get-client-ip.ts). This one is keyed on the business being targeted, so
   * it holds even against a distributed flood: whatever happens, one
   * contractor cannot receive more than this many lead notifications an
   * hour. Set well above any plausible real volume for a single
   * home-service business — a contractor genuinely receiving 30 leads in an
   * hour has a very good day, not a normal one.
   */
  leadsPerBusiness: { windowSeconds: 3600, limit: 30 },
} as const;

export const RATE_LIMIT_MESSAGE = "You're submitting too quickly. Please wait a few minutes and try again.";
