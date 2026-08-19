import "server-only";
import twilio from "twilio";

/**
 * Returns null (not a throw) when Twilio isn't configured — SMS is
 * additive and optional (PRODUCT_SPEC.md Section 19), so callers should
 * degrade gracefully rather than fail the operation that triggered them.
 */
export function createSmsClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  return twilio(accountSid, authToken);
}

export const SMS_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? null;
