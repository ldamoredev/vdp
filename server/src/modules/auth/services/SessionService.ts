import { randomBytes, createHash } from 'node:crypto';

import { SessionRepository } from '../domain/SessionRepository';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export class SessionService {
    constructor(private readonly sessions: SessionRepository) {}

    async create(
        userId: string,
        userAgent?: string | null,
        ipAddress?: string | null,
    ): Promise<{ id: string; token: string }> {
        const token = this.generateToken();
        const session = await this.sessions.createSession({
            userId,
            tokenHash: this.hashToken(token),
            expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
            userAgent,
            ipAddress,
        });
        return { id: session.id, token };
    }

    async findByToken(token: string): Promise<{ id: string; userId: string } | null> {
        const session = await this.sessions.findByTokenHash(this.hashToken(token));
        if (!session) return null;
        return { id: session.id, userId: session.userId };
    }

    async revoke(sessionId: string): Promise<void> {
        await this.sessions.revokeSession(sessionId, new Date());
    }

    private generateToken(): string {
        return randomBytes(32).toString('base64url');
    }

    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}
