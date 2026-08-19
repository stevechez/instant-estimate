import "server-only";
import nodemailer from "nodemailer";

/**
 * Provider-agnostic SMTP transport — works with the local Mailpit relay
 * (supabase/config.toml's [local_smtp] smtp_port, no auth) and with any
 * real transactional email provider's SMTP endpoint (Resend, Postmark, SES,
 * etc.) in production, via env vars only. No provider-specific SDK, so
 * swapping providers is a config change, not a code change — the same
 * reasoning PRODUCT_SPEC.md Section 19 gives for keeping the notification
 * channel abstraction thin enough that SMS can be added later without a
 * redesign.
 */
export function createEmailTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export const EMAIL_FROM = process.env.SMTP_FROM ?? "Instant Estimate <notifications@instant-estimate.local>";
