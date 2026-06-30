import { pgSchema, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

import { users } from '../../../auth/infrastructure/db/schema';

export const inboxSchema = pgSchema('inbox');

export const inboxItems = inboxSchema.table(
    'inbox_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        ownerUserId: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        text: text('text').notNull(),
        note: text('note'),
        status: varchar('status', { length: 20 }).notNull().default('pending'),
        routedTo: varchar('routed_to', { length: 40 }),
        triagedAt: timestamp('triaged_at', { withTimezone: true }),
        suggestedDestination: varchar('suggested_destination', { length: 40 }),
        suggestedAt: timestamp('suggested_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('inbox_items_owner_user_idx').on(table.ownerUserId),
        index('inbox_items_owner_status_idx').on(table.ownerUserId, table.status),
    ],
);
