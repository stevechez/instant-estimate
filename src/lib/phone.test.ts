import { describe, expect, it } from "vitest";
import { normalizePhoneToE164 } from "./phone";

describe("normalizePhoneToE164", () => {
  it("assumes +1 for a bare 10-digit US number", () => {
    expect(normalizePhoneToE164("5551234567")).toBe("+15551234567");
  });

  it("formats a typical US-formatted number with punctuation", () => {
    expect(normalizePhoneToE164("(555) 123-4567")).toBe("+15551234567");
  });

  it("accepts an 11-digit number already starting with 1", () => {
    expect(normalizePhoneToE164("15551234567")).toBe("+15551234567");
  });

  it("passes through an already-E.164 number unchanged", () => {
    expect(normalizePhoneToE164("+15551234567")).toBe("+15551234567");
  });

  it("accepts a non-US country code when explicitly given with +", () => {
    expect(normalizePhoneToE164("+442071838750")).toBe("+442071838750");
  });

  it("strips spaces and dashes before a leading +", () => {
    expect(normalizePhoneToE164("+1 555-123-4567")).toBe("+15551234567");
  });

  it("returns null for blank input", () => {
    expect(normalizePhoneToE164("")).toBeNull();
    expect(normalizePhoneToE164("   ")).toBeNull();
  });

  it("returns null for too few digits", () => {
    expect(normalizePhoneToE164("12345")).toBeNull();
    expect(normalizePhoneToE164("+1234")).toBeNull();
  });

  it("returns null for an 11-digit number not starting with 1", () => {
    expect(normalizePhoneToE164("25551234567")).toBeNull();
  });

  it("returns null for too many digits with no country code marker", () => {
    expect(normalizePhoneToE164("123456789012")).toBeNull();
  });
});
