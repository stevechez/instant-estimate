/**
 * Startup validation for configuration that fails *silently* in production.
 *
 * Deliberately without the `"server-only"` guard used elsewhere in lib/:
 * that import can't resolve outside the Next.js bundler, and this module is
 * pure enough to unit-test directly (same reasoning as lib/pricing/format.ts
 * and lib/rate-limit/client-ip.ts). Safe to leave unguarded because it only
 * ever reports whether a variable is *present* — it never returns or logs a
 * configured value. Only instrumentation.ts imports it, on the server.
 *
 * These aren't crashes — they're settings where a wrong value produces a
 * working-looking app that quietly does the wrong thing, with nothing in the
 * logs. The worst offender is APP_URL: left at its localhost default, every
 * "view this lead" link in a notification email or SMS points at the
 * contractor's own machine. The email sends, the lead saves, nothing errors,
 * and the link is simply dead.
 *
 * Deliberately warnings rather than a hard exit: refusing to boot over a bad
 * link URL would turn a degraded deploy into an outage. Sentry picks these
 * up (see instrumentation.ts) so they surface rather than scrolling past.
 */

function isLocalUrl(value: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(value);
}

export interface ConfigProblem {
  variable: string;
  message: string;
}

/** Pure so it can be unit-tested without mutating the real environment. */
export function findProductionConfigProblems(env: Record<string, string | undefined>): ConfigProblem[] {
  const problems: ConfigProblem[] = [];

  const appUrl = env.APP_URL;
  if (!appUrl) {
    problems.push({
      variable: "APP_URL",
      message:
        "Not set. Links in lead notification emails and texts will point at http://localhost:3000, which is unreachable for the contractor receiving them.",
    });
  } else if (isLocalUrl(appUrl)) {
    problems.push({
      variable: "APP_URL",
      message: `Set to a local address (${appUrl}). Links in lead notification emails and texts will be unreachable for the contractor receiving them.`,
    });
  }

  if (!env.SMTP_HOST) {
    problems.push({
      variable: "SMTP_HOST",
      message: "Not set. Lead notification emails cannot be sent — PRODUCT_SPEC.md Section 19 requires them.",
    });
  } else if (isLocalUrl(`http://${env.SMTP_HOST}`)) {
    problems.push({
      variable: "SMTP_HOST",
      message: `Points at a local address (${env.SMTP_HOST}) — that is the dev Mailpit relay, so no lead notification email will actually reach anyone.`,
    });
  }

  if (!env.ANTHROPIC_API_KEY) {
    problems.push({
      variable: "ANTHROPIC_API_KEY",
      message: "Not set. Every homeowner description will fail classification and fall through to 'quote required'.",
    });
  }

  return problems;
}

/** Called once per server start from instrumentation.ts. No-ops outside production. */
export function reportProductionConfigProblems(): void {
  if (process.env.NODE_ENV !== "production") return;

  for (const problem of findProductionConfigProblems(process.env)) {
    console.error(`[config] ${problem.variable}: ${problem.message}`);
  }
}
