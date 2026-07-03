import { AppSettings } from '@vdp/shared';
import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireSuperadmin } from '../../common/app/auth/UserIdentity';
import { AppSettingsRepository } from '../../common/base/settings/AppSettingsRepository';
import { AuditLogRepository } from '../domain/AuditLogRepository';

export class UpdateAppSettingsCommand extends Command<AppSettings> {
    constructor(readonly patch: Partial<AppSettings>) {
        super();
    }
}

export class UpdateAppSettingsCommandHandler implements RequestHandler<UpdateAppSettingsCommand, AppSettings> {
    constructor(
        private readonly settings: AppSettingsRepository,
        private readonly auditLogs: AuditLogRepository,
    ) {}

    async handle(command: UpdateAppSettingsCommand, identity: Identity): Promise<AppSettings> {
        const user = requireSuperadmin(identity);
        const settings = await this.settings.updateSettings(command.patch, user.userId);

        await this.auditLogs.createLog({
            actorUserId: user.userId,
            actorSessionId: user.sessionId,
            action: 'admin.settings_updated',
            resourceType: 'app_settings',
            metadata: command.patch,
        });

        return settings;
    }
}
