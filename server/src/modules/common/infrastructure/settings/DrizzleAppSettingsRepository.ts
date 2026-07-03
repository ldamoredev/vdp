import { AppSettings } from '@vdp/shared';

import { Database } from '../../base/db/Database';
import { AppSettingsRepository } from '../../base/settings/AppSettingsRepository';
import { appSettings } from './schema';

const DEFAULT_SETTINGS: AppSettings = {
    registrationEnabled: true,
    chatEnabledForUsers: true,
};

const REGISTRATION_ENABLED_KEY = 'registration_enabled';
const CHAT_ENABLED_FOR_USERS_KEY = 'chat_enabled_for_users';

export class DrizzleAppSettingsRepository extends AppSettingsRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async getSettings(): Promise<AppSettings> {
        const rows = await this.db.query.select().from(appSettings);
        const settings = { ...DEFAULT_SETTINGS };

        for (const row of rows) {
            if (row.key === REGISTRATION_ENABLED_KEY) {
                settings.registrationEnabled = parseBooleanValue(row.value, DEFAULT_SETTINGS.registrationEnabled);
            }
            if (row.key === CHAT_ENABLED_FOR_USERS_KEY) {
                settings.chatEnabledForUsers = parseBooleanValue(row.value, DEFAULT_SETTINGS.chatEnabledForUsers);
            }
        }

        return settings;
    }

    async updateSettings(patch: Partial<AppSettings>, updatedByUserId: string): Promise<AppSettings> {
        const updates: Array<{ key: string; value: boolean }> = [];
        if (patch.registrationEnabled !== undefined) {
            updates.push({ key: REGISTRATION_ENABLED_KEY, value: patch.registrationEnabled });
        }
        if (patch.chatEnabledForUsers !== undefined) {
            updates.push({ key: CHAT_ENABLED_FOR_USERS_KEY, value: patch.chatEnabledForUsers });
        }

        const updatedAt = new Date();
        for (const update of updates) {
            await this.db.query
                .insert(appSettings)
                .values({
                    key: update.key,
                    value: update.value,
                    updatedBy: updatedByUserId,
                    updatedAt,
                })
                .onConflictDoUpdate({
                    target: appSettings.key,
                    set: {
                        value: update.value,
                        updatedBy: updatedByUserId,
                        updatedAt,
                    },
                });
        }

        return this.getSettings();
    }
}

function parseBooleanValue(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}
