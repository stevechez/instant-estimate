import { describe, expect, it } from "vitest";
import { buildLeadSmsMessage } from "./message";

describe("buildLeadSmsMessage", () => {
  it("includes name, service, estimate, and a lead link", () => {
    const message = buildLeadSmsMessage({
      leadId: "lead_123",
      homeownerName: "Jane Homeowner",
      serviceName: "Toilet Repair / Replacement",
      estimateLine: "$225–$300",
    });

    expect(message).toContain("Jane Homeowner");
    expect(message).toContain("Toilet Repair / Replacement");
    expect(message).toContain("$225–$300");
    expect(message).toContain("/dashboard/leads/lead_123");
  });

  it("omits the service line when there is no matched service (quote_required path)", () => {
    const message = buildLeadSmsMessage({
      leadId: "lead_123",
      homeownerName: "Jane Homeowner",
      serviceName: null,
      estimateLine: "Quote required",
    });

    expect(message).not.toContain("null");
    expect(message).toContain("Quote required");
  });

  it("stays well within a couple of SMS segments for a typical case", () => {
    const message = buildLeadSmsMessage({
      leadId: "lead_123",
      homeownerName: "Jane Homeowner",
      serviceName: "Water Heater Repair / Replacement",
      estimateLine: "$1,275–$1,675",
    });

    // Not a hard SMS-segment assertion (that depends on encoding/carrier
    // details), just a guard against accidentally reintroducing the
    // description/urgency fields this format deliberately omits.
    expect(message.length).toBeLessThan(200);
  });
});
