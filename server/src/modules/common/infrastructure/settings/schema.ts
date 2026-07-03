import { jsonb, pgSchema, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from '../../../auth/infrastructure/db/schema';

export const coreSchema = pgSchema('core');

export const appSettings = coreSchema.table('app_settings', {
    key: varchar('key', { length: 60 }).primaryKey(),
    value: jsonb('value').notNull(),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
