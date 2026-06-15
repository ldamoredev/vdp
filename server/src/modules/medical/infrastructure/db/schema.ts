import { date, index, integer, pgSchema, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "../../../auth/infrastructure/db/schema";

export const medicalSchema = pgSchema("medical");

// ─── Medical records ─────────────────────────────────────
// The personal medical archive: consultas / estudios / vacunas / recetas.
// The most sensitive data in the system — never exposed through agent tools.
export const medicalRecords = medicalSchema.table(
  "records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 16 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    recordDate: date("record_date").notNull(),
    professional: varchar("professional", { length: 160 }),
    specialty: varchar("specialty", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("medical_records_owner_user_idx").on(table.ownerUserId)],
);

// File attachments: metadata only. The bytes live in core.file_blobs via the
// FileStorage seam, addressed by the opaque `storage_ref`.
export const medicalAttachments = medicalSchema.table(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recordId: uuid("record_id")
      .notNull()
      .references(() => medicalRecords.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 200 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageRef: uuid("storage_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("medical_attachments_record_idx").on(table.recordId),
    index("medical_attachments_owner_user_idx").on(table.ownerUserId),
  ],
);
