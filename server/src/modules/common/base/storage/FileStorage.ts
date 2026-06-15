/**
 * Blob storage port. The application stores opaque bytes and gets back an
 * opaque `ref` string; it never knows where the bytes live. The v1 impl is
 * PostgresFileStorage (bytea), but this seam lets us swap to object storage
 * (S3-compatible bucket) later without touching domain/app code.
 *
 * Authorization is NOT this layer's job: callers must check ownership (the
 * owning row, e.g. a medical attachment) before reading/deleting by ref.
 */
export abstract class FileStorage {
  /** Persist the bytes and return an opaque reference to them. */
  abstract save(content: Buffer): Promise<string>;
  /** Read the bytes for a ref, or null when the ref is unknown. */
  abstract read(ref: string): Promise<Buffer | null>;
  /** Delete the bytes for a ref. Idempotent. */
  abstract delete(ref: string): Promise<void>;
}
