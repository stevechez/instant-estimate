import { describe, expect, it } from "vitest";
import { parseClientIp, type IpHeaderName } from "./client-ip";

/** Builds the header lookup parseClientIp expects; absent keys return null, like Headers.get. */
function headers(values: Partial<Record<IpHeaderName, string>>) {
  return (name: IpHeaderName) => values[name] ?? null;
}

describe("parseClientIp", () => {
  it("takes the first entry from an x-forwarded-for chain", () => {
    expect(parseClientIp(headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1, 10.0.0.2" }))).toBe("203.0.113.5");
  });

  it("trims whitespace around the first entry", () => {
    expect(parseClientIp(headers({ "x-forwarded-for": " 203.0.113.5 , 10.0.0.1" }))).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(parseClientIp(headers({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip when x-forwarded-for is empty", () => {
    expect(parseClientIp(headers({ "x-forwarded-for": "", "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("returns 'unknown' when no usable header is present", () => {
    expect(parseClientIp(headers({}))).toBe("unknown");
    expect(parseClientIp(headers({ "x-forwarded-for": "," }))).toBe("unknown");
  });

  // The point of the precedence order: on a platform whose edge sets its own
  // header, a client-supplied x-forwarded-for must not be able to displace it
  // and mint a fresh rate-limit bucket per request.
  it("prefers Cloudflare's header over a spoofable x-forwarded-for", () => {
    const spoofed = headers({ "cf-connecting-ip": "203.0.113.1", "x-forwarded-for": "1.2.3.4" });
    expect(parseClientIp(spoofed)).toBe("203.0.113.1");
  });

  it("prefers Vercel's header over a spoofable x-forwarded-for", () => {
    const spoofed = headers({ "x-vercel-forwarded-for": "203.0.113.2", "x-forwarded-for": "1.2.3.4" });
    expect(parseClientIp(spoofed)).toBe("203.0.113.2");
  });

  it("gives an attacker no way to change buckets behind a trusted edge", () => {
    const attempts = ["1.1.1.1", "2.2.2.2", "3.3.3.3"].map((forged) =>
      parseClientIp(headers({ "cf-connecting-ip": "203.0.113.1", "x-forwarded-for": forged }))
    );
    expect(new Set(attempts).size).toBe(1);
  });
});
