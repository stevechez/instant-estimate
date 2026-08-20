import * as Sentry from "@sentry/nextjs";

/**
 * Runs once per server instance startup (Next.js instrumentation
 * convention — see node_modules/next/dist/docs/.../instrumentation.md).
 * Loads the runtime-appropriate Sentry init file.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Reports uncaught server-side errors to Sentry — covers Server Components,
 * Route Handlers, and Server Actions alike (context.routeType distinguishes
 * them), with no per-file wrapping needed anywhere else in the app.
 */
export const onRequestError = Sentry.captureRequestError;
