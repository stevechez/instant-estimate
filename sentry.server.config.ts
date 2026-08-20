import * as Sentry from "@sentry/nextjs";

// Sentry.init() with no dsn is a documented no-op — it doesn't throw and
// doesn't report anything. Safe to run unconditionally in every
// environment; error monitoring simply stays off until NEXT_PUBLIC_SENTRY_DSN
// is set (see .env.example).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Low sample rate by default — this is lead-capture traffic, not a
  // high-value trace-everything workload. Raise it once there's a reason to.
  tracesSampleRate: 0.1,
});
