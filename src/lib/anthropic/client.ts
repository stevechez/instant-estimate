import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/** Reads ANTHROPIC_API_KEY from the environment. Server-only — never call from a Client Component. */
export function createAnthropicClient() {
  return new Anthropic();
}
