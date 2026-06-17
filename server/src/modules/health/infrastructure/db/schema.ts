import {
  pgSchema,
  uuid,
  varchar,
  date,
  timestamp,
  index,
  uniqueIndex,
  decimal,
  integer,
  text,
} from "drizzle-orm/pg-core";
import { users } from '../../../auth/infrastructure/db/schema';

export const healthSchema = pgSchema("health");
export const medicalSchema = pgSchema("medical");

// ─── Habits ──────────────────────────────────────────────
// Habits can be daily or weekly-targeted. Completions live in habit_logs with
// one row per (habit, day); weekly cadence groups those rows by Monday-Sunday.
export const habits = healthSchema.table(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 8 }),
    cadence: varchar("cadence", { length: 12 }).notNull().default("daily"),
    weeklyTarget: integer("weekly_target"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("habits_owner_user_idx").on(table.ownerUserId),
  ]
);

export const habitLogs = healthSchema.table(
  "habit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("habit_logs_habit_date_idx").on(table.habitId, table.date),
    index("habit_logs_owner_user_idx").on(table.ownerUserId),
  ]
);

// ─── Counters ("days since") ─────────────────────────────
// Abstinence counters: they run up from started_at with no daily
// interaction. A relapse closes the attempt into counter_attempts and
// restarts the counter. last_milestone_notified dedupes lazy milestone
// detection on overview load (no scheduler in the stack).
export const counters = healthSchema.table(
  "counters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 8 }),
    dailyCost: decimal("daily_cost", { precision: 15, scale: 2 }),
    startedAt: date("started_at").notNull(),
    lastMilestoneNotified: integer("last_milestone_notified").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("counters_owner_user_idx").on(table.ownerUserId),
  ]
);

export const counterAttempts = healthSchema.table(
  "counter_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    counterId: uuid("counter_id")
      .notNull()
      .references(() => counters.id, { onDelete: 'cascade' }),
    startedAt: date("started_at").notNull(),
    endedAt: date("ended_at").notNull(),
    days: integer("days").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("counter_attempts_counter_idx").on(table.counterId),
    index("counter_attempts_owner_user_idx").on(table.ownerUserId),
  ]
);

// ─── Goals with deadlines ────────────────────────────────
// One-shot outcomes with a target date. deadline_notified is the lazy
// detection dedupe stage (none/t7/t1), persisted before emitting.
export const goals = healthSchema.table(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar("title", { length: 120 }).notNull(),
    notes: text("notes"),
    targetDate: date("target_date").notNull(),
    targetWeightKg: decimal("target_weight_kg", { precision: 6, scale: 2 }),
    status: varchar("status", { length: 12 }).notNull().default("active"),
    deadlineNotified: varchar("deadline_notified", { length: 4 }).notNull().default("none"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("goals_owner_user_idx").on(table.ownerUserId),
    index("goals_status_idx").on(table.status),
  ]
);

// ─── Weight trend ───────────────────────────────────────
// One body-weight entry per user/day. The upsert command lets today's number
// be corrected without turning this into a metrics platform.
export const weightEntries = healthSchema.table(
  "weight_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: date("date").notNull(),
    weightKg: decimal("weight_kg", { precision: 6, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("weight_entries_owner_date_idx").on(table.ownerUserId, table.date),
    index("weight_entries_owner_user_idx").on(table.ownerUserId),
  ],
);

// ─── Daily mood/energy check-ins ────────────────────────
// One row per user/day. The daily review ritual upserts this row so tapping
// another value corrects the day instead of duplicating it.
export const moodCheckIns = healthSchema.table(
  "mood_check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: date("date").notNull(),
    mood: integer("mood").notNull(),
    energy: integer("energy").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("mood_check_ins_owner_date_idx").on(table.ownerUserId, table.date),
    index("mood_check_ins_owner_user_idx").on(table.ownerUserId),
  ],
);

// ─── Medical records ─────────────────────────────────────
// Health's private medical archive: consultas / estudios / vacunas / recetas.
// The SQL namespace remains `medical` because migration 0005 already shipped
// it; code ownership lives in Health.
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
// FileStorage port, addressed by the opaque `storage_ref`.
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
