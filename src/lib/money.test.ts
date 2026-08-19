import { describe, expect, it } from "vitest";
import { centsToDollarStringOrBlank, parseDollarsToCents } from "./money";

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

describe("centsToDollarStringOrBlank", () => {
  it("renders an explicit 0 as \"0.00\", not blank", () => {
    expect(centsToDollarStringOrBlank(0)).toBe("0.00");
  });

  it("renders null as blank", () => {
    expect(centsToDollarStringOrBlank(null)).toBe("");
  });

  it("renders a positive amount as a fixed-2-decimal dollar string", () => {
    expect(centsToDollarStringOrBlank(27_550)).toBe("275.50");
  });

  it("round-trips with parseDollarsToCents for an explicit zero", () => {
    expect(centsToDollarStringOrBlank(parseDollarsToCents("0"))).toBe("0.00");
  });
});
