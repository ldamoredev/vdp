// File-upload validation for medical attachments. The security stance:
//
// 1. Do NOT trust the client-declared Content-Type. We sniff the real type from
//    the file's magic bytes and use that as the authoritative mime type.
// 2. Only an explicit allowlist of types is accepted (PDFs + common image
//    formats). No SVG (XSS via embedded script), no arbitrary executables.
// 3. Hard size cap, enforced both here and at the multipart layer.
//
// Pure functions, no I/O — the primary unit-test surface for file handling.

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export type AllowedMimeType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/heic";

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set<AllowedMimeType>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

/**
 * Detect the mime type from the leading bytes (the "magic number"), ignoring
 * the client-declared type. Returns null when the content matches none of the
 * allowed signatures.
 */
export function sniffMimeType(content: Buffer): AllowedMimeType | null {
  if (content.length >= 4 && content.toString("ascii", 0, 4) === "%PDF") {
    return "application/pdf";
  }
  if (
    content.length >= 8 &&
    content[0] === 0x89 &&
    content[1] === 0x50 && // P
    content[2] === 0x4e && // N
    content[3] === 0x47 && // G
    content[4] === 0x0d &&
    content[5] === 0x0a &&
    content[6] === 0x1a &&
    content[7] === 0x0a
  ) {
    return "image/png";
  }
  if (content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff) {
    return "image/jpeg";
  }
  // RIFF....WEBP
  if (
    content.length >= 12 &&
    content.toString("ascii", 0, 4) === "RIFF" &&
    content.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  // ISO-BMFF: ....ftyp<brand>; HEIC/HEIF brands
  if (content.length >= 12 && content.toString("ascii", 4, 8) === "ftyp") {
    const brand = content.toString("ascii", 8, 12);
    if (["heic", "heix", "heif", "mif1", "hevc", "msf1"].includes(brand)) {
      return "image/heic";
    }
  }
  return null;
}

/**
 * Strip any path components and dangerous characters from a client-supplied
 * filename, keeping a short, safe display name. Never used to address storage
 * (that is an opaque ref) — only for display and the download Content-Disposition.
 */
export function sanitizeFilename(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // keep word chars, dot, dash, parens, space; everything else (incl. control
    // characters) collapses to "_"
    .replace(/[^\w.\-() ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  return cleaned.length > 0 ? cleaned : "archivo";
}

export type FileValidationResult =
  | { ok: true; mimeType: AllowedMimeType; filename: string; sizeBytes: number }
  | { ok: false; reason: string };

export function validateUpload(input: {
  filename: string;
  content: Buffer;
}): FileValidationResult {
  const sizeBytes = input.content.length;
  if (sizeBytes === 0) {
    return { ok: false, reason: "El archivo está vacío." };
  }
  if (sizeBytes > MAX_FILE_BYTES) {
    return { ok: false, reason: `El archivo supera el máximo de ${MAX_FILE_BYTES / (1024 * 1024)}MB.` };
  }
  const mimeType = sniffMimeType(input.content);
  if (mimeType === null || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, reason: "Tipo de archivo no permitido. Solo PDF o imágenes (JPEG, PNG, WEBP, HEIC)." };
  }
  return { ok: true, mimeType, filename: sanitizeFilename(input.filename), sizeBytes };
}
