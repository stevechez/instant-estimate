import * as Sentry from "@sentry/nextjs";

// Client-side counterpart to sentry.server.config.ts/sentry.edge.config.ts.
// Next.js's native instrumentation-client convention (introduced 15.3) —
// runs before hydration, no explicit registration needed elsewhere.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
