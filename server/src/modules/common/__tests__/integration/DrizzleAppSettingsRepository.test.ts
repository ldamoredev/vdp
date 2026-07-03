import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { PRIMARY_TEST_USER } from '../../../../test/testUsers';
import { testDb } from '../../../../test/test-database';
import { DrizzleAppSettingsRepository } from '../../infrastructure/settings/DrizzleAppSettingsRepository';
import { appSettings } from '../../infrastructure/settings/schema';

const repo = new DrizzleAppSettingsRepository(testDb as never);

beforeEach(async () => {
    await testDb.truncate();
});

describe('DrizzleAppSettingsRepository', () => {
    it('returns defaults when no settings are persisted', async () => {
        await expect(repo.getSettings()).resolves.toEqual({
            registrationEnabled: true,
            chatEnabledForUsers: true,
        });
    });

    it('updates one key while keeping defaults for missing keys', async () => {
        const settings = await repo.updateSettings({ registrationEnabled: false }, PRIMARY_TEST_USER.id);

        expect(settings).toEqual({
            registrationEnabled: false,
            chatEnabledForUsers: true,
        });
        await expect(repo.getSettings()).resolves.toEqual(settings);
    });

    it('updates both keys and persists who changed them', async () => {
        const settings = await repo.updateSettings({
            registrationEnabled: false,
            chatEnabledForUsers: false,
        }, PRIMARY_TEST_USER.id);

        expect(settings).toEqual({
            registrationEnabled: false,
            chatEnabledForUsers: false,
        });

        const rows = await testDb.query
            .select()
            .from(appSettings)
            .where(eq(appSettings.updatedBy, PRIMARY_TEST_USER.id));

        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row.key).sort()).toEqual([
            'chat_enabled_for_users',
            'registration_enabled',
        ]);
        expect(rows.every((row) => row.updatedAt instanceof Date)).toBe(true);
    });
});
