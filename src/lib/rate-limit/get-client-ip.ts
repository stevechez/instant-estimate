import "server-only";
import { headers } from "next/headers";
import { parseClientIp } from "./client-ip";

/** Best-effort caller identity for rate limiting — see parseClientIp for the fallback chain. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return parseClientIp(h.get("x-forwarded-for"), h.get("x-real-ip"));
}
