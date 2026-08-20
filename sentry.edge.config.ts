import * as Sentry from "@sentry/nextjs";

// Same config as sentry.server.config.ts, for the edge runtime (proxy.ts).
// See that file's comment re: dsn-unset being a safe no-op.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
