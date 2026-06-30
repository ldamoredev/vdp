import {
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  date,
  index,
  uniqueIndex,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from '../../../auth/infrastructure/db/schema';
import { projects } from '../../../projects/infrastructure/db/schema';

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
    // Status: pending, in_progress, done, discarded
    priority: integer("priority").notNull().default(2),
    // Priority: 1=low, 2=medium, 3=high
    scheduledDate: date("scheduled_date").notNull(),
    // Which day this task belongs to (defaults to today)
    domain: varchar("domain", { length: 20 }),
    // Optional link: "wallet", "health", "work", "people", "study", or null
    projectId: uuid("project_id").references(() => projects.id, { onDelete: 'set null' }),
    boardStatus: varchar("board_status", { length: 20 }).notNull().default("backlog"),
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
    index("tasks_project_idx").on(table.projectId),
    index("tasks_project_board_idx").on(table.projectId, table.boardStatus),
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

// ─── Task Insights ───────────────────────────────────────
// Durable backing for TaskInsightsStore: the in-memory store stays the read
// model, this table survives restarts/deploys. Capped per user by the store.
export const taskInsights = tasksSchema.table(
  "task_insights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar("type", { length: 20 }).notNull(),
    // Type: achievement, warning, suggestion
    title: text("title").notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("task_insights_owner_created_idx").on(table.ownerUserId, table.createdAt),
  ]
);

// ─── Daily Review State (R1/R2) ──────────────────────────
// The daily ritual's ceremony state (evening close + morning plan), persisted
// per user per day so the ritual survives across devices. The underlying data
// (tasks, mood, movements) is already server-backed; only this ceremony state
// used to live in localStorage.
export const dailyReviewState = tasksSchema.table(
  "daily_review_state",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: date("date").notNull(),
    acknowledgedSignalIds: text("acknowledged_signal_ids").array().notNull().default([]),
    watchedCategoryIds: text("watched_category_ids").array().notNull().default([]),
    note: text("note").notNull().default(""),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    focusTaskId: uuid("focus_task_id").references(() => tasks.id, { onDelete: 'set null' }),
    plannedAt: timestamp("planned_at", { withTimezone: true }),
    morningBriefRequestedAt: timestamp("morning_brief_requested_at", { withTimezone: true }),
    eveningBriefRequestedAt: timestamp("evening_brief_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_review_owner_date_idx").on(table.ownerUserId, table.date),
  ]
);
