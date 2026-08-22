import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Dev-only: our browser automation tooling reaches this server via
  // 127.0.0.1 rather than localhost, which Next 16 otherwise rejects as a
  // cross-origin dev request (blockCrossSiteDEV in
  // node_modules/next/dist/server/lib/router-utils/block-cross-site-dev.js
  // matches on hostname only — no port, no protocol — so this must stay a
  // bare hostname, not "127.0.0.1:3000"). "localhost" itself needs no entry
  // here; Next allows it by default.
  allowedDevOrigins: ["127.0.0.1"],
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
