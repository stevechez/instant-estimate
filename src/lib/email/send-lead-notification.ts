import "server-only";
import { createEmailTransport, EMAIL_FROM } from "./client";

export interface LeadNotificationInput {
  contractorEmail: string;
  leadId: string;
  homeownerName: string;
  phone: string;
  email: string | null;
  serviceName: string | null;
  /** Pre-formatted for display (e.g. "$250–$325", "$150", or "Quote required") — the caller already has the typed estimate, this module just sends mail. */
  estimateLine: string;
  urgency: string | null;
  description: string | null;
}

/**
 * Required for MVP (PRODUCT_SPEC.md Section 19). Content: homeowner name,
 * service, estimate range, urgency, short description, contact info, and a
 * link to the lead. Plain text — an HTML template is a reasonable follow-up
 * polish, not required for the notification to do its job.
 *
 * Best-effort by design: the lead itself (already saved before this is
 * called) is the source of truth. A failed send should never make it look
 * like the homeowner's submission failed — see the try/catch at the call
 * site in app/e/[slug]/actions.ts.
 */
export async function sendLeadNotification(input: LeadNotificationInput): Promise<void> {
  const transport = createEmailTransport();
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const leadUrl = `${baseUrl}/dashboard/leads/${input.leadId}`;

  const lines = [
    "You have a new lead from your Instant Estimate widget.",
    "",
    `Name: ${input.homeownerName}`,
    `Phone: ${input.phone}`,
    input.email ? `Email: ${input.email}` : null,
    input.serviceName ? `Service: ${input.serviceName}` : null,
    `Estimate: ${input.estimateLine}`,
    input.urgency ? `Urgency: ${input.urgency}` : null,
    input.description ? "" : null,
    input.description ? `Description: ${input.description}` : null,
    "",
    `View this lead: ${leadUrl}`,
  ].filter((line): line is string => line !== null);

  await transport.sendMail({
    from: EMAIL_FROM,
    to: input.contractorEmail,
    subject: `New lead: ${input.homeownerName}${input.serviceName ? ` — ${input.serviceName}` : ""}`,
    text: lines.join("\n"),
  });
}
