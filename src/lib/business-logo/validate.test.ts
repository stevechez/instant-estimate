import { describe, expect, it } from "vitest";
import { buildLogoStoragePath, validateLogoFile } from "./validate";

function makeFile(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("validateLogoFile", () => {
  it("accepts jpg/png/webp under the size limit", () => {
    expect(validateLogoFile(makeFile("a.jpg", "image/jpeg", 1024)).ok).toBe(true);
    expect(validateLogoFile(makeFile("a.png", "image/png", 1024)).ok).toBe(true);
    expect(validateLogoFile(makeFile("a.webp", "image/webp", 1024)).ok).toBe(true);
  });

  it("rejects unsupported types", () => {
    const result = validateLogoFile(makeFile("a.gif", "image/gif", 1024));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toMatch(/jpg, png, or webp/i);
  });

  it("rejects files over the size limit", () => {
    const result = validateLogoFile(makeFile("a.jpg", "image/jpeg", 3 * 1024 * 1024));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toMatch(/smaller than 2mb/i);
  });
});

describe("buildLogoStoragePath", () => {
  it("namespaces by business id and derives the extension from MIME type", () => {
    const path = buildLogoStoragePath("biz-1", makeFile("whatever.png", "image/png", 10), "uuid-1");
    expect(path).toBe("biz-1/uuid-1.png");
  });

  it("ignores the original filename entirely", () => {
    const path = buildLogoStoragePath("biz-1", makeFile("../../etc/passwd.jpg", "image/jpeg", 10), "uuid-1");
    expect(path).toBe("biz-1/uuid-1.jpg");
  });
});
