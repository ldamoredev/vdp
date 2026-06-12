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

// ─── Habits ──────────────────────────────────────────────
// Daily habits only: the v1 health slice. One row per habit; completions
// live in habit_logs with one row per (habit, day).
export const habits = healthSchema.table(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 100 }).notNull(),
    emoji: varchar("emoji", { length: 8 }),
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
