import "server-only";
import OpenAI from "openai";

/** Reads OPENAI_API_KEY from the environment. Server-only — never call from a Client Component. */
export function createOpenAIClient() {
  return new OpenAI();
}
