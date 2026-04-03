import {
    boolean,
    index,
    inet,
    jsonb,
    pgSchema,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('core');

export const users = authSchema.table(
    'users',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        displayName: varchar('display_name', { length: 120 }).notNull(),
        passwordHash: text('password_hash').notNull(),
        role: varchar('role', { length: 20 }).notNull().default('user'),
        isActive: boolean('is_active').notNull().default(true),
        lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('users_email_idx').on(table.email),
    ],
);

export const sessions = authSchema.table(
    'sessions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tokenHash: text('token_hash').notNull().unique(),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
        lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
        userAgent: text('user_agent'),
        ipAddress: inet('ip_address'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('sessions_user_idx').on(table.userId),
        index('sessions_expires_idx').on(table.expiresAt),
    ],
);

export const auditLogs = authSchema.table(
    'audit_logs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
        actorSessionId: uuid('actor_session_id').references(() => sessions.id, { onDelete: 'set null' }),
        action: varchar('action', { length: 120 }).notNull(),
        resourceType: varchar('resource_type', { length: 120 }).notNull(),
        resourceId: varchar('resource_id', { length: 255 }),
        metadata: jsonb('metadata'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('audit_logs_actor_idx').on(table.actorUserId, table.createdAt),
    ],
);
