export interface LeadSmsContent {
  leadId: string;
  homeownerName: string;
  serviceName: string | null;
  /** Pre-formatted, e.g. "$250–$325" or "Quote required" — same convention as sendLeadNotification's estimateLine. */
  estimateLine: string;
}

/**
 * Deliberately separate from send-lead-sms.ts (which is server-only —
 * touches Twilio credentials) so this pure content logic is directly
 * unit-testable without a live Twilio account (see message.test.ts).
 *
 * Short by design: SMS carriers split messages over ~160 characters into
 * multiple segments (billed separately), so this omits the description and
 * urgency that the email notification includes in full — name, service,
 * estimate, and the lead link are what a contractor needs to decide whether
 * to look now or later.
 */
export function buildLeadSmsMessage(content: LeadSmsContent): string {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const leadUrl = `${baseUrl}/dashboard/leads/${content.leadId}`;

  const parts = [
    `New lead: ${content.homeownerName}`,
    content.serviceName,
    `Est: ${content.estimateLine}`,
    leadUrl,
  ].filter((part): part is string => !!part);

  return parts.join(" — ");
}
