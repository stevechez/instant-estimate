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

  it("never leaves a trailing dash when truncation lands right after one", () => {
    // 59 word chars + a separator (-> dash at index 59) + more text: slicing
    // to 60 chars cuts exactly at that dash unless it's trimmed afterward.
    const input = "a".repeat(59) + " " + "b".repeat(20);
    const result = slugify(input);
    expect(result).toBe("a".repeat(59));
    expect(result.endsWith("-")).toBe(false);
  });
});
