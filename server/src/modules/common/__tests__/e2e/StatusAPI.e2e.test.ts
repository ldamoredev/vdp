import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { App } from '../../../../App';
import { Core } from '../../../Core';
import { AppSettingsRepository } from '../../base/settings/AppSettingsRepository';
import { TestDatabase } from '../../../../test/test-database';
import { TestCoreConfiguration } from '../../../auth/__tests__/e2e/TestCoreConfiguration';
import { users } from '../../../auth/infrastructure/db/schema';

const testDb = new TestDatabase();
let app: App;
const previousAgentProvider = process.env.AGENT_PROVIDER;
const previousOllamaBaseUrl = process.env.OLLAMA_BASE_URL;

beforeAll(async () => {
    process.env.AGENT_PROVIDER = 'ollama';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    await testDb.setup();
    app = new App(new Core(new TestCoreConfiguration()));
    await app.app.ready();
}, 30_000);

beforeEach(async () => {
    await testDb.truncate({ users: [] });
});

afterAll(async () => {
    restoreEnv('AGENT_PROVIDER', previousAgentProvider);
    restoreEnv('OLLAMA_BASE_URL', previousOllamaBaseUrl);
    await app.stop();
});

function restoreEnv(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
}

async function registerUser(email: string) {
    const response = await app.app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
            email,
            displayName: 'Status User',
            password: 'super-secret-password',
        },
    });

    return { status: response.statusCode, body: response.json() };
}

describe('Status API — E2E', () => {
    it('reports admin-disabled chat for normal sessions but leaves superadmin chat enabled', async () => {
        const registered = await registerUser('status@vdp.local');
        expect(registered.status).toBe(200);
        const token = registered.body.sessionToken as string;

        const settings = app.core.getRepository(AppSettingsRepository);
        await settings.updateSettings({ chatEnabledForUsers: false }, registered.body.user.id);

        const normal = await app.app.inject({
            method: 'GET',
            url: '/api/health',
            headers: { 'x-session-token': token },
        });
        expect(normal.statusCode).toBe(200);
        expect(normal.json().agentChat).toEqual({
            enabled: false,
            reason: 'chat_disabled_by_admin',
        });

        await testDb.query
            .update(users)
            .set({ role: 'superadmin' })
            .where(eq(users.email, 'status@vdp.local'));

        const superadmin = await app.app.inject({
            method: 'GET',
            url: '/api/health',
            headers: { 'x-session-token': token },
        });
        expect(superadmin.statusCode).toBe(200);
        expect(superadmin.json().agentChat).toEqual({ enabled: true });
    });
});
