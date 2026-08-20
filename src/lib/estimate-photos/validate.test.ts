import { describe, expect, it } from "vitest";
import { MAX_ESTIMATE_PHOTOS, buildPhotoStoragePath, selectValidPhotos } from "./validate";

function makeFile(name: string, type: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("selectValidPhotos", () => {
  it("accepts valid image files", () => {
    const files = [makeFile("a.jpg", "image/jpeg", 100), makeFile("b.png", "image/png", 100)];
    const { valid, rejected } = selectValidPhotos(files);
    expect(valid).toHaveLength(2);
    expect(rejected).toHaveLength(0);
  });

  it("skips zero-byte files (empty file input slots)", () => {
    const files = [makeFile("", "application/octet-stream", 0)];
    const { valid, rejected } = selectValidPhotos(files);
    expect(valid).toHaveLength(0);
    expect(rejected).toHaveLength(0);
  });

  it("caps at MAX_ESTIMATE_PHOTOS and rejects the rest", () => {
    const files = Array.from({ length: 5 }, (_, i) => makeFile(`p${i}.jpg`, "image/jpeg", 100));
    const { valid, rejected } = selectValidPhotos(files);
    expect(valid).toHaveLength(MAX_ESTIMATE_PHOTOS);
    expect(rejected).toHaveLength(2);
    expect(rejected[0].reason).toMatch(/only 3 photos/i);
  });

  it("rejects non-image files", () => {
    const { valid, rejected } = selectValidPhotos([makeFile("doc.pdf", "application/pdf", 100)]);
    expect(valid).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/only image files/i);
  });

  it("rejects oversized files", () => {
    const { valid, rejected } = selectValidPhotos([makeFile("huge.jpg", "image/jpeg", 9 * 1024 * 1024)]);
    expect(valid).toHaveLength(0);
    expect(rejected[0].reason).toMatch(/too large/i);
  });
});

describe("buildPhotoStoragePath", () => {
  it("uses the file's own extension when present", () => {
    const path = buildPhotoStoragePath("est-1", makeFile("sink.JPG", "image/jpeg", 10), "uuid-1");
    expect(path).toBe("est-1/uuid-1.jpg");
  });

  it("falls back to an extension derived from the MIME type", () => {
    const path = buildPhotoStoragePath("est-1", makeFile("blob", "image/png", 10), "uuid-1");
    expect(path).toBe("est-1/uuid-1.png");
  });

  it("falls back to no extension for an unrecognized type with no filename extension", () => {
    const path = buildPhotoStoragePath("est-1", makeFile("blob", "image/avif", 10), "uuid-1");
    expect(path).toBe("est-1/uuid-1");
  });
});
