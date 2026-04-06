import { eq, sql } from 'drizzle-orm';

import { Database } from '../../../common/base/db/Database';
import { CreateUserData, UserRecord, UserRepository } from '../../domain/UserRepository';
import { users } from '../schema';

export class DrizzleUserRepository extends UserRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async countUsers(): Promise<number> {
        const [result] = await this.db.query
            .select({ count: sql<number>`count(*)::int` })
            .from(users);
        return result.count;
    }

    async findByEmail(email: string): Promise<UserRecord | null> {
        const [row] = await this.db.query.select().from(users).where(eq(users.email, email));
        return row ? toUserRecord(row) : null;
    }

    async findById(id: string): Promise<UserRecord | null> {
        const [row] = await this.db.query.select().from(users).where(eq(users.id, id));
        return row ? toUserRecord(row) : null;
    }

    async createUser(data: CreateUserData): Promise<UserRecord> {
        const [row] = await this.db.query
            .insert(users)
            .values({
                email: data.email,
                displayName: data.displayName,
                passwordHash: data.passwordHash,
                role: data.role ?? 'user',
            })
            .returning();
        return toUserRecord(row);
    }

    async updateLastLoginAt(id: string, lastLoginAt: Date): Promise<void> {
        await this.db.query
            .update(users)
            .set({ lastLoginAt, updatedAt: new Date() })
            .where(eq(users.id, id));
    }

    async updateProfile(id: string, data: { displayName: string }): Promise<UserRecord | null> {
        const [row] = await this.db.query
            .update(users)
            .set({
                displayName: data.displayName,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id))
            .returning();

        return row ? toUserRecord(row) : null;
    }

    async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
        await this.db.query
            .update(users)
            .set({
                passwordHash,
                updatedAt: new Date(),
            })
            .where(eq(users.id, id));
    }
}

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
    return {
        ...row,
        role: 'user',
    };
}
