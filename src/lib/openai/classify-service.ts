import "server-only";
import { createOpenAIClient } from "./client";

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
 *
 * Backed by OpenAI's Responses API with Structured Outputs. Previously
 * Anthropic (claude-opus-5) — moved because the Anthropic account ran out of
 * balance; see git history for that implementation. gpt-5.4-mini is a
 * low-cost, low-latency model: this is a short, bounded classification into
 * a small fixed set, not a task that benefits from a larger/reasoning model.
 */
export async function classifyServiceFromDescription(
  description: string,
  services: ClassifiableService[]
): Promise<ClassificationResult> {
  if (services.length === 0) {
    return { serviceKey: null };
  }

  try {
    const client = createOpenAIClient();
    const serviceKeys = services.map((s) => s.key);
    const serviceList = services.map((s) => `- ${s.key}: ${s.name}`).join("\n");

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      max_output_tokens: 200,
      instructions: `You are helping route a homeowner's plumbing problem description to one of a contractor's configured service categories. You are not diagnosing the problem and you are not providing any pricing — you are only deciding which configured category, if any, the description clearly matches.

Available services:
${serviceList}

Rules:
- Only return a service_key if the description clearly and confidently matches one of the services listed above.
- Return null if the description is ambiguous, doesn't match any listed service, describes something out of scope for an automated estimate (e.g. sewer line replacement, whole-house repiping, slab leaks, major water damage, complex gas-line work), or you are not confident.
- Never return a service_key that isn't in the list above.`,
      input: description,
      text: {
        format: {
          type: "json_schema",
          name: "service_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              service_key: {
                // A plain `type: ["string", "null"]` + `enum` was rejected by
                // Anthropic's structured-output validator in the prior
                // implementation ("Enum value ... does not match declared
                // type"); keeping the same anyOf shape here since it's the
                // portable way to express "one of these strings, or null"
                // and OpenAI's Structured Outputs supports it the same way.
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
    });

    if (response.status !== "completed" || !response.output_text) {
      return { serviceKey: null };
    }

    const parsed = JSON.parse(response.output_text) as { service_key: string | null };
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
