import { describe, expect, it } from "vitest";
import { parseClientIp } from "./client-ip";

describe("parseClientIp", () => {
  it("takes the first entry from a x-forwarded-for chain", () => {
    expect(parseClientIp("203.0.113.5, 10.0.0.1, 10.0.0.2", null)).toBe("203.0.113.5");
  });

  it("trims whitespace around the first entry", () => {
    expect(parseClientIp(" 203.0.113.5 , 10.0.0.1", null)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(parseClientIp(null, "203.0.113.9")).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip when x-forwarded-for is empty", () => {
    expect(parseClientIp("", "203.0.113.9")).toBe("203.0.113.9");
  });

  it("returns 'unknown' when neither header is present", () => {
    expect(parseClientIp(null, null)).toBe("unknown");
  });

  it("returns 'unknown' for a malformed empty-entry header with no real-ip fallback", () => {
    expect(parseClientIp(",", null)).toBe("unknown");
  });
});
