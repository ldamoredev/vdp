import {
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from '../../../auth/infrastructure/db/schema';

export const projectsSchema = pgSchema("projects");

export const clients = projectsSchema.table(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 160 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("clients_owner_user_idx").on(table.ownerUserId),
    index("clients_status_idx").on(table.status),
    uniqueIndex("clients_owner_name_idx").on(table.ownerUserId, table.name),
  ],
);

export const projects = projectsSchema.table(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: varchar("kind", { length: 20 }).notNull(),
    outcome: text("outcome").notNull(),
    nextAction: text("next_action").notNull(),
    focus: varchar("focus", { length: 160 }).notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: 'set null' }),
    client: varchar("client", { length: 160 }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("projects_owner_user_idx").on(table.ownerUserId),
    index("projects_status_idx").on(table.status),
    index("projects_kind_idx").on(table.kind),
    index("projects_client_idx").on(table.clientId),
  ],
);

export const timeEntries = projectsSchema.table(
  "time_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
    taskId: uuid("task_id"),
    date: date("date").notNull(),
    minutes: integer("minutes").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("time_entries_owner_date_idx").on(table.ownerUserId, table.date),
    index("time_entries_project_date_idx").on(table.projectId, table.date),
    index("time_entries_task_idx").on(table.taskId),
  ],
);
