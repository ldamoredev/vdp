import { AppSettings } from '@vdp/shared';

export abstract class AppSettingsRepository {
    abstract getSettings(): Promise<AppSettings>;
    abstract updateSettings(patch: Partial<AppSettings>, updatedByUserId: string): Promise<AppSettings>;
}
