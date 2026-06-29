import { pgSchema, uuid, varchar, decimal, date, timestamp, index } from 'drizzle-orm/pg-core';

import { users } from '../../../auth/infrastructure/db/schema';

export const objectivesSchema = pgSchema('objectives');

export const objectives = objectivesSchema.table(
    'objectives',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        ownerUserId: uuid('owner_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        title: varchar('title', { length: 180 }).notNull(),
        periodStart: date('period_start').notNull(),
        periodEnd: date('period_end').notNull(),
        metricSource: varchar('metric_source', { length: 40 }).notNull(),
        target: decimal('target', { precision: 15, scale: 2 }).notNull(),
        unit: varchar('unit', { length: 24 }).notNull(),
        manualValue: decimal('manual_value', { precision: 15, scale: 2 }),
        status: varchar('status', { length: 20 }).notNull().default('active'),
        archivedAt: timestamp('archived_at', { withTimezone: true }),
        achievedAt: timestamp('achieved_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('objectives_owner_user_idx').on(table.ownerUserId),
        index('objectives_status_idx').on(table.status),
        index('objectives_period_idx').on(table.ownerUserId, table.periodStart, table.periodEnd),
    ],
);
