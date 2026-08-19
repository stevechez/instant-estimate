import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and dashes non-alphanumeric runs", () => {
    expect(slugify("Steve's Plumbing Co.")).toBe("steve-s-plumbing-co");
  });

  it("strips accents", () => {
    expect(slugify("Métro Ave Plumbing")).toBe("metro-ave-plumbing");
  });

  it("trims leading/trailing dashes", () => {
    expect(slugify("  --Ace Plumbing!!--  ")).toBe("ace-plumbing");
  });

  it("caps length at 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long)).toHaveLength(60);
  });
});
