import { UserRepository } from '../domain/UserRepository';
import { AppSettingsRepository } from '../../common/base/settings/AppSettingsRepository';

export class GetSetupStatus {
    constructor(
        private readonly users: UserRepository,
        private readonly settings: AppSettingsRepository,
    ) {}

    async execute(): Promise<{ hasUsers: boolean; registrationEnabled: boolean }> {
        const [usersCount, settings] = await Promise.all([
            this.users.countUsers(),
            this.settings.getSettings(),
        ]);
        return {
            hasUsers: usersCount > 0,
            registrationEnabled: settings.registrationEnabled,
        };
    }
}
