import "server-only";
import { createSmsClient, SMS_FROM_NUMBER } from "./client";
import { buildLeadSmsMessage, type LeadSmsContent } from "./message";

export interface SendLeadSmsInput extends LeadSmsContent {
  /** E.164, e.g. "+15551234567" — callers should already have normalized this (see lib/phone.ts). */
  toPhone: string;
}

/**
 * Best-effort, same as sendLeadNotification: never throws in a way that
 * should block lead capture. No-ops (with a warning) when Twilio isn't
 * configured, so this is safe to call unconditionally once a phone number
 * exists — see the caller in app/e/[slug]/actions.ts.
 */
export async function sendLeadSms(input: SendLeadSmsInput): Promise<void> {
  const client = createSmsClient();

  if (!client || !SMS_FROM_NUMBER) {
    console.warn(
      "SMS notification skipped: Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER)."
    );
    return;
  }

  await client.messages.create({
    to: input.toPhone,
    from: SMS_FROM_NUMBER,
    body: buildLeadSmsMessage(input),
  });
}
