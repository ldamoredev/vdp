import {
  pgSchema,
  uuid,
  varchar,
  date,
  timestamp,
  index,
  uniqueIndex,
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
