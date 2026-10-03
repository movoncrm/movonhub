import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_EXT,
  MAX_IMAGE_BYTES,
  type AllowedImageType,
} from "./config";

/**
 * Image type detection based on file signatures (magic bytes).
 *
 * Never trust the browser-supplied MIME type or filename: verify the actual
 * bytes before persisting an upload.
 */

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length; i += 1) out += String.fromCharCode(bytes[i] ?? 0);
  return out;
}

export function detectImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "image/webp";

  return null;
}

export interface ImageValidationResult {
  ok: boolean;
  type?: AllowedImageType;
  extension?: string;
  error?: string;
}

/**
 * Validate an uploaded image buffer against size, allow-list and magic bytes.
 * `declaredType` (if provided) must agree with the detected type.
 */
export function validateImageBuffer(
  bytes: Uint8Array,
  declaredType?: string,
): ImageValidationResult {
  if (!bytes || bytes.length === 0) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }

  if (declaredType && !ALLOWED_IMAGE_TYPES.includes(declaredType as AllowedImageType)) {
    return { ok: false, error: "Image must be a JPG, PNG or WebP file." };
  }

  const detected = detectImageType(bytes);
  if (!detected) {
    return { ok: false, error: "Image must be a JPG, PNG or WebP file." };
  }
  if (declaredType && declaredType !== detected) {
    // The browser reported one type but the bytes are another: treat as spoofed.
    return { ok: false, error: "Image file content does not match its type." };
  }

  return { ok: true, type: detected, extension: IMAGE_EXT[detected] };
}
