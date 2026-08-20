import { describe, expect, it } from "vitest";
import { INPUT_LIMITS, sanitizeAddOnKeys, withinLimit } from "./input-limits";

describe("withinLimit", () => {
  it("accepts values at or under the limit", () => {
    expect(withinLimit("A".repeat(INPUT_LIMITS.name), "name")).toBe(true);
    expect(withinLimit("Steve", "name")).toBe(true);
  });

  it("rejects values over the limit", () => {
    expect(withinLimit("A".repeat(INPUT_LIMITS.name + 1), "name")).toBe(false);
    expect(withinLimit("A".repeat(1_000_000), "description")).toBe(false);
  });

  it("treats absent values as passing — presence is the caller's concern", () => {
    expect(withinLimit(null, "email")).toBe(true);
    expect(withinLimit(undefined, "email")).toBe(true);
  });

  it("accepts an empty string", () => {
    expect(withinLimit("", "name")).toBe(true);
  });
});

describe("sanitizeAddOnKeys", () => {
  it("passes through a normal selection unchanged", () => {
    expect(sanitizeAddOnKeys(["haul_away", "permit"])).toEqual(["haul_away", "permit"]);
  });

  it("caps the number of keys", () => {
    const many = Array.from({ length: 500 }, (_, i) => `k${i}`);
    expect(sanitizeAddOnKeys(many)).toHaveLength(INPUT_LIMITS.addOnKeyCount);
  });

  it("drops oversized keys", () => {
    expect(sanitizeAddOnKeys(["ok", "A".repeat(INPUT_LIMITS.addOnKeyLength + 1)])).toEqual(["ok"]);
  });

  it("drops non-string entries", () => {
    expect(sanitizeAddOnKeys(["ok", 42, null, { a: 1 }, ["nested"]])).toEqual(["ok"]);
  });

  it("returns an empty array for non-array input", () => {
    expect(sanitizeAddOnKeys("haul_away")).toEqual([]);
    expect(sanitizeAddOnKeys(null)).toEqual([]);
    expect(sanitizeAddOnKeys(undefined)).toEqual([]);
    expect(sanitizeAddOnKeys({ 0: "a", length: 1 })).toEqual([]);
  });
});
