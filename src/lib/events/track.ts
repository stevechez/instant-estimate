import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gate 5 instrumentation (see HANDOFF.md): a small, fixed set of business
 * events answering "why did this business get N visitors but fewer
 * estimates" and "what are homeowners typing that we don't understand" —
 * not a general analytics system. See supabase/migrations/20260822130000_business_events.sql
 * for the table and its retention (90 days, internal-only).
 *
 * The funnel: estimate_started -> (service_classified | service_unmatched)
 * -> (estimate_completed | estimate_unmatched) -> lead_submitted.
 * estimate_failed is orthogonal to that funnel — it marks an actual
 * infrastructure failure (e.g. the OpenAI call itself erroring), not a
 * normal "no match" outcome, which is what service_unmatched/
 * estimate_unmatched already cover.
 */
export type BusinessEventType =
  | "estimate_started"
  | "service_classified"
  | "service_unmatched"
  | "estimate_completed"
  | "estimate_unmatched"
  | "estimate_failed"
  | "lead_submitted";

/**
 * Fire-and-forget: never throws, never blocks or fails the caller. Same
 * best-effort philosophy as lead notifications and photo uploads elsewhere
 * in this codebase — instrumentation must never be able to break the
 * actual homeowner-facing flow it's observing.
 */
export async function trackEvent(
  eventType: BusinessEventType,
  businessId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("business_events")
      .insert({ event_type: eventType, business_id: businessId, metadata });
    if (error) {
      console.error(`Failed to track ${eventType}:`, error);
    }
  } catch (err) {
    console.error(`Failed to track ${eventType}:`, err);
  }
}
