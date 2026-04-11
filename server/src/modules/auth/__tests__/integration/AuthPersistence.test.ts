import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { DrizzleUserRepository } from '../../infrastructure/db/DrizzleUserRepository';
import { DrizzleSessionRepository } from '../../infrastructure/db/DrizzleSessionRepository';
import { DrizzleAuditLogRepository } from '../../infrastructure/db/DrizzleAuditLogRepository';
import { PasswordService } from '../../services/PasswordService';
import { SessionService } from '../../services/SessionService';
import { RegisterUser } from '../../services/RegisterUser';
import { LoginUser } from '../../services/LoginUser';
import { LogoutUser } from '../../services/LogoutUser';
import { UpdateProfile } from '../../services/UpdateProfile';
import { ChangePassword } from '../../services/ChangePassword';
import { GetSecurityOverview } from '../../services/GetSecurityOverview';
import { LogoutOtherSessions } from '../../services/LogoutOtherSessions';
import { auditLogs, sessions } from '../../infrastructure/schema';
import { ConflictHttpError } from '../../../common/http/errors';
import { testDb } from '../../../tasks/__tests__/integration/test-database';

const userRepo = new DrizzleUserRepository(testDb as never);
const sessionRepo = new DrizzleSessionRepository(testDb as never);
const auditLogRepo = new DrizzleAuditLogRepository(testDb as never);
const passwordService = new PasswordService();
const sessionService = new SessionService(sessionRepo);

beforeEach(async () => {
    await testDb.truncate({ users: [] });
});

async function createPersistedUser(overrides?: {
    email?: string;
    displayName?: string;
    password?: string;
}) {
    return userRepo.createUser({
        email: overrides?.email ?? 'owner@vdp.local',
        displayName: overrides?.displayName ?? 'Owner',
        passwordHash: await passwordService.hash(overrides?.password ?? 'super-secret-password'),
        role: 'user',
    });
}

describe('Auth persistence integration', () => {
    describe('DrizzleUserRepository', () => {
        it('creates, counts, finds, and updates last login timestamp', async () => {
            expect(await userRepo.countUsers()).toBe(0);

            const created = await createPersistedUser();
            expect(await userRepo.countUsers()).toBe(1);

            const byEmail = await userRepo.findByEmail('owner@vdp.local');
            expect(byEmail?.id).toBe(created.id);

            const byId = await userRepo.findById(created.id);
            expect(byId?.email).toBe('owner@vdp.local');

            const loginAt = new Date('2026-04-05T12:00:00.000Z');
            await userRepo.updateLastLoginAt(created.id, loginAt);

            const updated = await userRepo.findById(created.id);
            expect(updated?.lastLoginAt?.toISOString()).toBe(loginAt.toISOString());
        });

        it('updates profile fields and password hash', async () => {
            const created = await createPersistedUser();

            const updatedProfile = await userRepo.updateProfile(created.id, {
                displayName: 'Updated Owner',
            });
            expect(updatedProfile?.displayName).toBe('Updated Owner');

            const newPasswordHash = await passwordService.hash('new-super-secret-password');
            await userRepo.updatePasswordHash(created.id, newPasswordHash);

            const updated = await userRepo.findById(created.id);
            expect(updated?.passwordHash).not.toBe(created.passwordHash);
            await expect(passwordService.verify('new-super-secret-password', updated!.passwordHash)).resolves.toBe(true);
        });
    });

    describe('DrizzleSessionRepository', () => {
        it('creates and returns an active session by token hash', async () => {
            const user = await createPersistedUser();

            const created = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'token-hash',
                expiresAt: new Date(Date.now() + 60_000),
                userAgent: 'vitest',
                ipAddress: '127.0.0.1',
            });

            const found = await sessionRepo.findByTokenHash('token-hash');

            expect(found?.id).toBe(created.id);
            expect(found?.userId).toBe(user.id);
            expect(found?.userAgent).toBe('vitest');
        });

        it('does not return expired or revoked sessions', async () => {
            const user = await createPersistedUser();

            const expired = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'expired-hash',
                expiresAt: new Date(Date.now() - 60_000),
            });
            const revoked = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'revoked-hash',
                expiresAt: new Date(Date.now() + 60_000),
            });
            await sessionRepo.revokeSession(revoked.id, new Date());

            await expect(sessionRepo.findByTokenHash('expired-hash')).resolves.toBeNull();
            await expect(sessionRepo.findByTokenHash('revoked-hash')).resolves.toBeNull();
            expect(expired.id).toBeDefined();
        });

        it('updates lastSeenAt when touched', async () => {
            const user = await createPersistedUser();
            const created = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'touch-hash',
                expiresAt: new Date(Date.now() + 60_000),
            });

            const touchedAt = new Date('2026-04-05T14:15:00.000Z');
            await sessionRepo.touchSession(created.id, touchedAt);

            const [row] = await testDb.query
                .select()
                .from(sessions)
                .where(eq(sessions.id, created.id))
                .limit(1);

            expect(row.lastSeenAt.toISOString()).toBe(touchedAt.toISOString());
        });

        it('revokes all active sessions for a user', async () => {
            const user = await createPersistedUser();
            const first = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'first-session',
                expiresAt: new Date(Date.now() + 60_000),
            });
            const second = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'second-session',
                expiresAt: new Date(Date.now() + 60_000),
            });

            await sessionRepo.revokeSessionsForUser(user.id, new Date());

            await expect(sessionRepo.findByTokenHash('first-session')).resolves.toBeNull();
            await expect(sessionRepo.findByTokenHash('second-session')).resolves.toBeNull();

            const rows = await testDb.query
                .select()
                .from(sessions)
                .where(eq(sessions.userId, user.id));

            expect(rows.find((row) => row.id === first.id)?.revokedAt).toBeInstanceOf(Date);
            expect(rows.find((row) => row.id === second.id)?.revokedAt).toBeInstanceOf(Date);
        });

        it('lists active sessions and can revoke all except the current one', async () => {
            const user = await createPersistedUser();
            const current = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'current-session',
                expiresAt: new Date(Date.now() + 60_000),
            });
            const remote = await sessionRepo.createSession({
                userId: user.id,
                tokenHash: 'remote-session',
                expiresAt: new Date(Date.now() + 60_000),
            });

            const listed = await sessionRepo.listActiveSessionsForUser(user.id);
            expect(listed.map((session) => session.id)).toEqual([remote.id, current.id]);

            await sessionRepo.revokeOtherSessionsForUser(user.id, current.id, new Date());

            await expect(sessionRepo.findByTokenHash('current-session')).resolves.not.toBeNull();
            await expect(sessionRepo.findByTokenHash('remote-session')).resolves.toBeNull();
        });
    });

    describe('RegisterUser / LoginUser / LogoutUser', () => {
        it('allows registration after users already exist and writes an audit log', async () => {
            const registerUser = new RegisterUser(userRepo, auditLogRepo, passwordService, sessionService);

            const first = await registerUser.execute({
                email: 'first@vdp.local',
                displayName: 'First User',
                password: 'super-secret-password',
            });

            expect(first.user.email).toBe('first@vdp.local');
            expect(first.sessionToken).toBeTypeOf('string');

            const [registrationLog] = await testDb.query
                .select()
                .from(auditLogs)
                .where(eq(auditLogs.action, 'auth.user_registered'))
                .limit(1);

            expect(registrationLog.actorUserId).toBe(first.user.id);
            expect(registrationLog.actorSessionId).toBeTruthy();
            expect(registrationLog.resourceId).toBe(first.user.id);

            const second = await registerUser.execute({
                email: 'second@vdp.local',
                displayName: 'Second User',
                password: 'super-secret-password',
            });

            expect(second.user.email).toBe('second@vdp.local');
            expect(second.sessionToken).toBeTypeOf('string');

            const registrationLogs = await testDb.query
                .select()
                .from(auditLogs)
                .where(eq(auditLogs.action, 'auth.user_registered'));

            expect(registrationLogs).toHaveLength(2);
        });

        it('rejects duplicate email registration', async () => {
            const registerUser = new RegisterUser(userRepo, auditLogRepo, passwordService, sessionService);

            await registerUser.execute({
                email: 'duplicate@vdp.local',
                displayName: 'Original User',
                password: 'super-secret-password',
            });

            await expect(
                registerUser.execute({
                    email: 'duplicate@vdp.local',
                    displayName: 'Duplicate User',
                    password: 'super-secret-password',
                }),
            ).rejects.toBeInstanceOf(ConflictHttpError);
        });

        it('logs login and logout against persisted audit records', async () => {
            const user = await createPersistedUser({
                email: 'login@vdp.local',
                displayName: 'Login User',
            });
            const loginUser = new LoginUser(userRepo, auditLogRepo, passwordService, sessionService);
            const logoutUser = new LogoutUser(auditLogRepo, sessionService);

            const login = await loginUser.execute({
                email: 'login@vdp.local',
                password: 'super-secret-password',
                userAgent: 'integration-test',
                ipAddress: '127.0.0.1',
            });

            expect(login.user.id).toBe(user.id);

            const [loginLog] = await testDb.query
                .select()
                .from(auditLogs)
                .where(eq(auditLogs.action, 'auth.login'))
                .limit(1);

            expect(loginLog.actorUserId).toBe(user.id);
            expect(loginLog.actorSessionId).toBeTruthy();
            expect(loginLog.resourceType).toBe('session');

            const activeSession = await sessionService.findByToken(login.sessionToken);
            expect(activeSession?.userId).toBe(user.id);

            await logoutUser.execute(login.sessionToken);

            const revokedSession = await sessionService.findByToken(login.sessionToken);
            expect(revokedSession).toBeNull();

            const logoutEntries = await testDb.query
                .select()
                .from(auditLogs)
                .where(eq(auditLogs.action, 'auth.logout'));

            expect(logoutEntries).toHaveLength(1);
            expect(logoutEntries[0].actorUserId).toBe(user.id);
            expect(logoutEntries[0].actorSessionId).toBe(loginLog.actorSessionId);
        });

        it('updates the profile and records an audit log', async () => {
            const user = await createPersistedUser();
            const updateProfile = new UpdateProfile(userRepo, auditLogRepo);
            const loginUser = new LoginUser(userRepo, auditLogRepo, passwordService, sessionService);
            const login = await loginUser.execute({
                email: user.email,
                password: 'super-secret-password',
            });
            const session = await sessionService.findByToken(login.sessionToken);

            const updated = await updateProfile.execute({
                userId: user.id,
                sessionId: session?.id ?? null,
                displayName: 'Renamed User',
            });

            expect(updated.displayName).toBe('Renamed User');

            const [auditEntry] = await testDb.query
                .select()
                .from(auditLogs)
                .where(eq(auditLogs.action, 'auth.profile_updated'))
                .limit(1);

            expect(auditEntry.actorUserId).toBe(user.id);
            expect(auditEntry.actorSessionId).toBe(session?.id);
        });

        it('changes the password, revokes sessions, and records an audit log', async () => {
            const user = await createPersistedUser({
                email: 'password@vdp.local',
                displayName: 'Password User',
                password: 'old-password-123',
            });
            const loginUser = new LoginUser(userRepo, auditLogRepo, passwordService, sessionService);
            const changePassword = new ChangePassword(userRepo, auditLogRepo, passwordService, sessionService);

            const login = await loginUser.execute({
                email: 'password@vdp.local',
                password: 'old-password-123',
            });
            const currentSession = await sessionService.findByToken(login.sessionToken);
            expect(currentSession).not.toBeNull();

            await changePassword.execute({
                userId: user.id,
                sessionId: currentSession?.id ?? null,
                currentPassword: 'old-password-123',
                newPassword: 'new-password-123',
            });

            await expect(sessionService.findByToken(login.sessionToken)).resolves.toBeNull();
            await expect(
                loginUser.execute({
                    email: 'password@vdp.local',
                    password: 'old-password-123',
                }),
            ).rejects.toThrow('Invalid credentials');

            const relogin = await loginUser.execute({
                email: 'password@vdp.local',
                password: 'new-password-123',
            });
            expect(relogin.user.id).toBe(user.id);

            const [auditEntry] = await testDb.query
                .select()
                .from(auditLogs)
                .where(eq(auditLogs.action, 'auth.password_changed'))
                .limit(1);

            expect(auditEntry.actorUserId).toBe(user.id);
            expect(auditEntry.actorSessionId).toBe(currentSession?.id);
        });

        it('returns a security overview and can revoke other active sessions', async () => {
            const user = await createPersistedUser({
                email: 'security@vdp.local',
                displayName: 'Security User',
            });
            const loginUser = new LoginUser(userRepo, auditLogRepo, passwordService, sessionService);
            const getSecurityOverview = new GetSecurityOverview(sessionService, auditLogRepo);
            const logoutOtherSessions = new LogoutOtherSessions(auditLogRepo, sessionService);

            const currentLogin = await loginUser.execute({
                email: 'security@vdp.local',
                password: 'super-secret-password',
                userAgent: 'Desktop Chrome',
                ipAddress: '127.0.0.1',
            });
            const remoteLogin = await loginUser.execute({
                email: 'security@vdp.local',
                password: 'super-secret-password',
                userAgent: 'Mobile Safari',
                ipAddress: '127.0.0.2',
            });

            const currentSession = await sessionService.findByToken(currentLogin.sessionToken);
            expect(currentSession).not.toBeNull();

            const overviewBefore = await getSecurityOverview.execute({
                userId: user.id,
                currentSessionId: currentSession?.id ?? null,
            });

            expect(overviewBefore.sessions).toHaveLength(2);
            expect(overviewBefore.sessions.find((session) => session.id === currentSession?.id)?.isCurrent).toBe(true);
            expect(overviewBefore.events[0]?.action).toBe('auth.login');

            const logoutResult = await logoutOtherSessions.execute({
                userId: user.id,
                currentSessionId: currentSession?.id ?? null,
            });

            expect(logoutResult).toEqual({ revokedSessions: 1 });
            await expect(sessionService.findByToken(remoteLogin.sessionToken)).resolves.toBeNull();
            await expect(sessionService.findByToken(currentLogin.sessionToken)).resolves.not.toBeNull();

            const latestEvents = await auditLogRepo.listRecentAuthLogsForActorUser(user.id, 3);
            expect(latestEvents[0]?.action).toBe('auth.logout_other_sessions');
        });
    });
});
