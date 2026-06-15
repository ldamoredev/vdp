import { eq } from "drizzle-orm";

import { Database } from "../../base/db/Database";
import { FileStorage } from "../../base/storage/FileStorage";
import { fileBlobs } from "./schema";

/**
 * FileStorage backed by a Postgres BYTEA column. The ref is the blob row id.
 * Postgres stores large bytea out-of-line (TOAST), so rows that don't select
 * `content` stay cheap. Fine for a personal-scale medical archive; swap for an
 * object-storage impl behind the same port if volume ever demands it.
 */
export class PostgresFileStorage extends FileStorage {
  constructor(private readonly db: Database) {
    super();
  }

  async save(content: Buffer): Promise<string> {
    const [row] = await this.db.query
      .insert(fileBlobs)
      .values({ content, sizeBytes: content.length })
      .returning({ ref: fileBlobs.ref });
    return row.ref;
  }

  async read(ref: string): Promise<Buffer | null> {
    const [row] = await this.db.query
      .select({ content: fileBlobs.content })
      .from(fileBlobs)
      .where(eq(fileBlobs.ref, ref))
      .limit(1);
    return row ? row.content : null;
  }

  async delete(ref: string): Promise<void> {
    await this.db.query.delete(fileBlobs).where(eq(fileBlobs.ref, ref));
  }
}
