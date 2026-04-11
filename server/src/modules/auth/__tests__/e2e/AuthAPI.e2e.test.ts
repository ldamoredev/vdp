import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { TestDatabase } from '../../../tasks/__tests__/integration/test-database';
import { TestApp } from './TestApp';

const testDb = new TestDatabase();
const testApp = new TestApp();

beforeAll(async () => {
    await testDb.setup();
    await testApp.setup();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate({ users: [] });
});

afterAll(async () => {
    await testApp.teardown();
});

async function registerUser(payload?: Record<string, unknown>) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
            email: 'owner@vdp.local',
            displayName: 'Owner',
            password: 'super-secret-password',
            ...payload,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

async function loginUser(payload?: Record<string, unknown>) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
            email: 'owner@vdp.local',
            password: 'super-secret-password',
            ...payload,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

async function updateProfile(sessionToken: string, payload?: Record<string, unknown>) {
    const response = await testApp.app.inject({
        method: 'PATCH',
        url: '/api/auth/profile',
        headers: { 'x-session-token': sessionToken },
        payload: {
            displayName: 'Renamed Owner',
            ...payload,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

async function changePassword(sessionToken: string, payload?: Record<string, unknown>) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: { 'x-session-token': sessionToken },
        payload: {
            currentPassword: 'super-secret-password',
            newPassword: 'even-more-secret-password',
            ...payload,
        },
    });

    return { status: response.statusCode, body: response.json() };
}

async function getSecurity(sessionToken: string) {
    const response = await testApp.app.inject({
        method: 'GET',
        url: '/api/auth/security',
        headers: { 'x-session-token': sessionToken },
    });

    return { status: response.statusCode, body: response.json() };
}

async function logoutOthers(sessionToken: string) {
    const response = await testApp.app.inject({
        method: 'POST',
        url: '/api/auth/logout-others',
        headers: { 'x-session-token': sessionToken },
    });

    return { status: response.statusCode, body: response.json() };
}

describe('Auth API — E2E', () => {
    it('reports setup status before and after the first registration', async () => {
        const before = await testApp.app.inject({ method: 'GET', url: '/api/auth/setup' });
        expect(before.statusCode).toBe(200);
        expect(before.json()).toEqual({ hasUsers: false });

        const registered = await registerUser();
        expect(registered.status).toBe(200);
        expect(registered.body.user.email).toBe('owner@vdp.local');
        expect(registered.body.sessionToken).toBeTypeOf('string');

        const after = await testApp.app.inject({ method: 'GET', url: '/api/auth/setup' });
        expect(after.statusCode).toBe(200);
        expect(after.json()).toEqual({ hasUsers: true });
    });

    it('covers register, login, me, logout, and revoked-session access', async () => {
        const registered = await registerUser();
        const registrationToken = registered.body.sessionToken;

        const meWithRegistrationToken = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': registrationToken },
        });
        expect(meWithRegistrationToken.statusCode).toBe(200);
        expect(meWithRegistrationToken.json()).toMatchObject({
            user: {
                email: 'owner@vdp.local',
                displayName: 'Owner',
                role: 'user',
            },
        });

        const loggedIn = await loginUser();
        expect(loggedIn.status).toBe(200);
        const loginToken = loggedIn.body.sessionToken as string;

        const meAfterLogin = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': loginToken },
        });
        expect(meAfterLogin.statusCode).toBe(200);
        expect(meAfterLogin.json().user.email).toBe('owner@vdp.local');

        const logout = await testApp.app.inject({
            method: 'POST',
            url: '/api/auth/logout',
            headers: {
                cookie: `vdp_session=${encodeURIComponent(loginToken)}`,
            },
        });
        expect(logout.statusCode).toBe(200);
        expect(logout.json()).toEqual({ ok: true });

        const meAfterLogout = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': loginToken },
        });
        expect(meAfterLogout.statusCode).toBe(401);
        expect(meAfterLogout.json()).toMatchObject({
            error: 'UNAUTHORIZED',
            message: 'Invalid session',
        });
    });

    it('rejects invalid credentials', async () => {
        await registerUser();

        const response = await loginUser({ password: 'wrong-password' });

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
            error: 'UNAUTHORIZED',
            message: 'Invalid credentials',
        });
    });

    it('rejects duplicate email registration', async () => {
        const first = await registerUser({
            email: 'duplicate@vdp.local',
            displayName: 'Original User',
        });
        expect(first.status).toBe(200);

        const second = await registerUser({
            email: 'duplicate@vdp.local',
            displayName: 'Duplicate User',
        });

        expect(second.status).toBe(409);
        expect(second.body).toMatchObject({
            error: 'CONFLICT',
            message: 'Email already registered',
        });
    });

    it('allows registration when users already exist', async () => {
        const first = await registerUser();
        expect(first.status).toBe(200);

        const second = await registerUser({
            email: 'second@vdp.local',
            displayName: 'Second User',
        });

        expect(second.status).toBe(200);
        expect(second.body).toMatchObject({
            user: {
                email: 'second@vdp.local',
                displayName: 'Second User',
                role: 'user',
            },
        });
        expect(second.body.sessionToken).toBeTypeOf('string');
    });

    it('updates the current user profile', async () => {
        const registered = await registerUser();
        const sessionToken = registered.body.sessionToken as string;

        const updated = await updateProfile(sessionToken, {
            displayName: 'Updated Owner',
        });

        expect(updated.status).toBe(200);
        expect(updated.body).toMatchObject({
            user: {
                email: 'owner@vdp.local',
                displayName: 'Updated Owner',
                role: 'user',
            },
        });

        const me = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': sessionToken },
        });
        expect(me.statusCode).toBe(200);
        expect(me.json().user.displayName).toBe('Updated Owner');
    });

    it('changes password, revokes the current session, rejects the old password, and allows re-login', async () => {
        const registered = await registerUser();
        const sessionToken = registered.body.sessionToken as string;

        const changed = await changePassword(sessionToken, {
            currentPassword: 'super-secret-password',
            newPassword: 'even-more-secret-password',
        });

        expect(changed.status).toBe(200);
        expect(changed.body).toEqual({ ok: true });

        const meAfterChange = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': sessionToken },
        });
        expect(meAfterChange.statusCode).toBe(401);

        const oldLogin = await loginUser({ password: 'super-secret-password' });
        expect(oldLogin.status).toBe(401);
        expect(oldLogin.body).toMatchObject({
            error: 'UNAUTHORIZED',
            message: 'Invalid credentials',
        });

        const newLogin = await loginUser({ password: 'even-more-secret-password' });
        expect(newLogin.status).toBe(200);
        expect(newLogin.body.user.email).toBe('owner@vdp.local');
    });

    it('returns a security overview and can revoke other active sessions', async () => {
        const registered = await registerUser();
        const registrationToken = registered.body.sessionToken as string;
        const loggedIn = await loginUser();
        const currentToken = loggedIn.body.sessionToken as string;

        const overview = await getSecurity(currentToken);
        expect(overview.status).toBe(200);
        expect(overview.body.sessions).toHaveLength(2);
        expect(overview.body.sessions.some((session: { isCurrent: boolean }) => session.isCurrent)).toBe(true);
        expect(overview.body.events.some((event: { action: string }) => event.action === 'auth.login')).toBe(true);

        const revoked = await logoutOthers(currentToken);
        expect(revoked.status).toBe(200);
        expect(revoked.body).toEqual({ revokedSessions: 1 });

        const oldSessionMe = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': registrationToken },
        });
        expect(oldSessionMe.statusCode).toBe(401);

        const currentSessionMe = await testApp.app.inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { 'x-session-token': currentToken },
        });
        expect(currentSessionMe.statusCode).toBe(200);

        const updatedOverview = await getSecurity(currentToken);
        expect(updatedOverview.status).toBe(200);
        expect(updatedOverview.body.sessions).toHaveLength(1);
        expect(updatedOverview.body.events[0]?.action).toBe('auth.logout_other_sessions');
    });
});
