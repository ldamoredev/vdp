export type SessionRecord = {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    lastSeenAt: Date;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: Date;
};

export type CreateSessionData = {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
};

export abstract class SessionRepository {
    abstract createSession(data: CreateSessionData): Promise<SessionRecord>;
    abstract findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
    abstract touchSession(id: string, lastSeenAt: Date): Promise<void>;
    abstract revokeSession(id: string, revokedAt: Date): Promise<void>;
}
