import {
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { users } from '../../../common/infrastructure/auth/schema';

export const tasksSchema = pgSchema("tasks");

// ─── Tasks ───────────────────────────────────────────────
// Deliberately simple daily list. Not project management.
export const tasks = tasksSchema.table(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    // Status: pending, done, discarded
    priority: integer("priority").notNull().default(2),
    // Priority: 1=low, 2=medium, 3=high
    scheduledDate: date("scheduled_date").notNull(),
    // Which day this task belongs to (defaults to today)
    domain: varchar("domain", { length: 20 }),
    // Optional link: "wallet", "health", "work", "people", "study", or null
    completedAt: timestamp("completed_at", { withTimezone: true }),
    carryOverCount: integer("carry_over_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_owner_user_idx").on(table.ownerUserId),
    index("tasks_scheduled_date_idx").on(table.scheduledDate),
    index("tasks_status_idx").on(table.status),
    index("tasks_domain_idx").on(table.domain),
    index("tasks_date_status_idx").on(table.scheduledDate, table.status),
  ]
);

// ─── Task Notes ──────────────────────────────────────────
// Simple append-only notes for a task
export const taskNotes = tasksSchema.table(
  "task_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    authorUserId: uuid("author_user_id").notNull().references(() => users.id, { onDelete: 'restrict' }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    content: text("content").notNull(),
    type: varchar("type", { length: 30 }).notNull().default("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("task_notes_owner_user_idx").on(table.ownerUserId),
    index("task_notes_task_idx").on(table.taskId),
  ]
);
