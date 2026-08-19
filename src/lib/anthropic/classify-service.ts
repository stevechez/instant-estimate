import "server-only";
import { createAnthropicClient } from "./client";

export interface ClassifiableService {
  key: string;
  name: string;
}

export interface ClassificationResult {
  /** null when the description doesn't confidently match any configured service — routes to the contractor-contact path (PRODUCT_SPEC.md Section 15). */
  serviceKey: string | null;
}

/**
 * AI interprets the homeowner; it does not price anything (PRODUCT_SPEC.md
 * Section 2 / PRICING_ENGINE_SPEC.md Section 2). This function's only job is
 * picking which of the business's own configured services (if any) the
 * homeowner's free-text description matches — constrained by structured
 * output to the literal set of service keys passed in, so the model cannot
 * invent a service that isn't actually configured and priced.
 *
 * Fails closed: any classification failure (ambiguous input, refusal, API
 * error, malformed output) returns serviceKey: null rather than guessing —
 * "prefer uncertainty over fabricated confidence" (PRODUCT_SPEC.md Section 23).
 */
export async function classifyServiceFromDescription(
  description: string,
  services: ClassifiableService[]
): Promise<ClassificationResult> {
  if (services.length === 0) {
    return { serviceKey: null };
  }

  try {
    const client = createAnthropicClient();
    const serviceKeys = services.map((s) => s.key);
    const serviceList = services.map((s) => `- ${s.key}: ${s.name}`).join("\n");

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      // Disabled thinking + low effort: this is a simple, scoped classification
      // into a small fixed set, not a task that benefits from deliberation —
      // and it's a latency-sensitive call inside a live homeowner-facing widget.
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              service_key: {
                // A single `type: ["string", "null"]` array paired with
                // `enum` is rejected by the API ("Enum value ... does not
                // match declared type") — verified by actually calling it,
                // not assumed. anyOf is the supported way to express
                // "one of these strings, or null".
                anyOf: [{ type: "string", enum: serviceKeys }, { type: "null" }],
                description:
                  "The key of the service that best matches the homeowner's description, or null if none confidently match.",
              },
            },
            required: ["service_key"],
            additionalProperties: false,
          },
        },
      },
      system: `You are helping route a homeowner's plumbing problem description to one of a contractor's configured service categories. You are not diagnosing the problem and you are not providing any pricing — you are only deciding which configured category, if any, the description clearly matches.

Available services:
${serviceList}

Rules:
- Only return a service_key if the description clearly and confidently matches one of the services listed above.
- Return null if the description is ambiguous, doesn't match any listed service, describes something out of scope for an automated estimate (e.g. sewer line replacement, whole-house repiping, slab leaks, major water damage, complex gas-line work), or you are not confident.
- Never return a service_key that isn't in the list above.`,
      messages: [{ role: "user", content: description }],
    });

    if (response.stop_reason === "refusal") {
      return { serviceKey: null };
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { serviceKey: null };
    }

    const parsed = JSON.parse(textBlock.text) as { service_key: string | null };
    // Re-validate against the actual input set rather than trusting the
    // schema constraint alone — cheap defense in depth.
    if (parsed.service_key && serviceKeys.includes(parsed.service_key)) {
      return { serviceKey: parsed.service_key };
    }
    return { serviceKey: null };
  } catch (error) {
    console.error("classifyServiceFromDescription failed:", error);
    return { serviceKey: null };
  }
}
