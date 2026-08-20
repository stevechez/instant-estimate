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
} as const;

export const RATE_LIMIT_MESSAGE = "You're submitting too quickly. Please wait a few minutes and try again.";
