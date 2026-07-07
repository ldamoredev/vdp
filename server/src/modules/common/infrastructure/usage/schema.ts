import { date, integer, pgSchema, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from '../../../auth/infrastructure/db/schema';

export const coreSchema = pgSchema('core');

/**
 * Owner-usage counters (F1.2): one row per (owner, surface, action, day),
 * `count` incremented on repeat. Read with plain SQL — no UI by design.
 */
export const usageEvents = coreSchema.table(
    'usage_events',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        ownerUserId: uuid('owner_user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        surface: varchar('surface', { length: 40 }).notNull(),
        action: varchar('action', { length: 120 }).notNull(),
        occurredOn: date('occurred_on').notNull(),
        count: integer('count').notNull().default(1),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('usage_events_owner_key_day_idx').on(
            table.ownerUserId,
            table.surface,
            table.action,
            table.occurredOn,
        ),
    ],
);
