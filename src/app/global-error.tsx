"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Catches errors that escape every other error boundary (including the
 * root layout itself). Must define its own <html>/<body> — it replaces the
 * root layout entirely when active (Next.js global-error convention), which
 * also means it does NOT get globals.css/Tailwind/themed components — hence
 * plain inline styles and a native <button> rather than @/components/ui.
 * Prop is `retry`, not `reset` — see
 * node_modules/next/dist/docs/.../error.md for this app's Next.js version.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 500 }}>Something went wrong</h1>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          We&apos;ve been notified. Please try again.
        </p>
        <button
          onClick={() => retry()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.375rem",
            border: "1px solid #d1d5db",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
