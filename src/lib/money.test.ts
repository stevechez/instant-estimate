import { describe, expect, it } from "vitest";
import { parseDollarsToCents } from "./money";

describe("parseDollarsToCents", () => {
  it("parses plain numbers", () => {
    expect(parseDollarsToCents("275")).toBe(27_500);
  });

  it("parses decimals", () => {
    expect(parseDollarsToCents("275.50")).toBe(27_550);
  });

  it("strips a leading dollar sign and thousands commas", () => {
    expect(parseDollarsToCents("$1,200")).toBe(120_000);
  });

  it("returns null for blank input", () => {
    expect(parseDollarsToCents("")).toBeNull();
    expect(parseDollarsToCents("   ")).toBeNull();
    expect(parseDollarsToCents(null)).toBeNull();
    expect(parseDollarsToCents(undefined)).toBeNull();
  });

  it("returns null for negative or non-numeric input", () => {
    expect(parseDollarsToCents("-50")).toBeNull();
    expect(parseDollarsToCents("abc")).toBeNull();
  });

  it("returns 0 for an explicit zero, distinct from blank", () => {
    expect(parseDollarsToCents("0")).toBe(0);
  });
});
