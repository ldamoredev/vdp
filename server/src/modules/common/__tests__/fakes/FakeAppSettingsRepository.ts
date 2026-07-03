import { AppSettings } from '@vdp/shared';

import { AppSettingsRepository } from '../../base/settings/AppSettingsRepository';

export class FakeAppSettingsRepository extends AppSettingsRepository {
    readonly updates: Array<{ patch: Partial<AppSettings>; updatedByUserId: string }> = [];
    private settings: AppSettings = {
        registrationEnabled: true,
        chatEnabledForUsers: true,
    };

    async getSettings(): Promise<AppSettings> {
        return { ...this.settings };
    }

    async updateSettings(patch: Partial<AppSettings>, updatedByUserId: string): Promise<AppSettings> {
        this.settings = { ...this.settings, ...patch };
        this.updates.push({ patch: { ...patch }, updatedByUserId });
        return this.getSettings();
    }
}
