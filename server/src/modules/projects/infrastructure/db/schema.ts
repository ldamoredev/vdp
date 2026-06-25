import {
  pgSchema,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from '../../../auth/infrastructure/db/schema';

export const projectsSchema = pgSchema("projects");

export const projects = projectsSchema.table(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: varchar("kind", { length: 20 }).notNull(),
    outcome: text("outcome").notNull(),
    nextAction: text("next_action").notNull(),
    focus: varchar("focus", { length: 160 }).notNull(),
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
  ],
);
