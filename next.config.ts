import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

// Only wrap with Sentry's build plugin (uploads source maps on build) once
// real credentials exist. Without SENTRY_AUTH_TOKEN this would otherwise
// try to talk to a Sentry org/project that doesn't exist yet on every local
// and CI build — Sentry.init() itself (sentry.*.config.ts,
// instrumentation-client.ts) already no-ops safely without a DSN, but the
// build-time plugin has no equivalent "just skip it" default, so the
// wrapping itself is conditional here instead.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
    })
  : nextConfig;
