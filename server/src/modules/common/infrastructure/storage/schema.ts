import { customType, integer, pgSchema, timestamp, uuid } from "drizzle-orm/pg-core";

// Postgres BYTEA <-> Node Buffer. node-postgres already returns bytea as a
// Buffer and accepts a Buffer on insert, so this is a thin passthrough type.
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// Generic blob store, owned by the FileStorage seam (not a domain module). Lives
// in the shared `core` schema. Authorization happens on the owning domain row
// (e.g. medical.attachments); blobs are addressed only by opaque ref.
export const coreSchema = pgSchema("core");

export const fileBlobs = coreSchema.table("file_blobs", {
  ref: uuid("ref").primaryKey().defaultRandom(),
  content: bytea("content").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
