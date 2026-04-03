import { and, eq, isNull } from 'drizzle-orm';

import { Database } from '../../base/db/Database';
import { CreateSessionData, SessionRecord, SessionRepository } from '../../base/auth/SessionRepository';
import { sessions } from './schema';

export class DrizzleSessionRepository extends SessionRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async createSession(data: CreateSessionData): Promise<SessionRecord> {
        const [row] = await this.db.query
            .insert(sessions)
            .values({
                userId: data.userId,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
                userAgent: data.userAgent ?? null,
                ipAddress: data.ipAddress ?? null,
            })
            .returning();
        return row;
    }

    async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
        const [row] = await this.db.query
            .select()
            .from(sessions)
            .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
            .limit(1);
        return row ?? null;
    }

    async touchSession(id: string, lastSeenAt: Date): Promise<void> {
        await this.db.query.update(sessions).set({ lastSeenAt }).where(eq(sessions.id, id));
    }

    async revokeSession(id: string, revokedAt: Date): Promise<void> {
        await this.db.query.update(sessions).set({ revokedAt }).where(eq(sessions.id, id));
    }
}
