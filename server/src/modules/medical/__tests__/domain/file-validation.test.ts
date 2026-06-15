import { describe, expect, it } from "vitest";

import {
  MAX_FILE_BYTES,
  sanitizeFilename,
  sniffMimeType,
  validateUpload,
} from "../../domain/file-validation";

const PDF = Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
]);

describe("sniffMimeType", () => {
  it("detects the type from magic bytes", () => {
    expect(sniffMimeType(PDF)).toBe("application/pdf");
    expect(sniffMimeType(PNG)).toBe("image/png");
    expect(sniffMimeType(JPEG)).toBe("image/jpeg");
    expect(sniffMimeType(WEBP)).toBe("image/webp");
  });

  it("returns null for content that matches no allowed signature", () => {
    expect(sniffMimeType(Buffer.from("just some text"))).toBeNull();
    // an SVG/HTML payload is plain text — never accepted (XSS surface)
    expect(sniffMimeType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });
});

describe("sanitizeFilename", () => {
  it("strips path components and dangerous characters", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("C:\\Users\\me\\receta.pdf")).toBe("receta.pdf");
    expect(sanitizeFilename("estudio*?<>.pdf")).toBe("estudio_.pdf");
  });

  it("falls back when nothing usable remains", () => {
    expect(sanitizeFilename("")).toBe("archivo");
    expect(sanitizeFilename("///")).toBe("archivo");
  });
});

describe("validateUpload", () => {
  it("accepts an allowed type and returns the sniffed mime + safe filename", () => {
    const result = validateUpload({ filename: "../mi receta.pdf", content: PDF });
    expect(result).toEqual({
      ok: true,
      mimeType: "application/pdf",
      filename: "mi receta.pdf",
      sizeBytes: PDF.length,
    });
  });

  it("uses the sniffed type, not a (spoofable) declared one", () => {
    // content is a PNG even if a client claimed application/pdf — we trust bytes
    const result = validateUpload({ filename: "fake.pdf", content: PNG });
    expect(result.ok && result.mimeType).toBe("image/png");
  });

  it("rejects empty, oversized, and disallowed files", () => {
    expect(validateUpload({ filename: "x.pdf", content: Buffer.alloc(0) })).toMatchObject({ ok: false });
    expect(
      validateUpload({ filename: "x.pdf", content: Buffer.alloc(MAX_FILE_BYTES + 1) }),
    ).toMatchObject({ ok: false });
    expect(validateUpload({ filename: "x.txt", content: Buffer.from("plain") })).toMatchObject({ ok: false });
  });
});
