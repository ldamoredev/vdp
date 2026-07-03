import { AppSettings } from '@vdp/shared';
import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireSuperadmin } from '../../common/app/auth/UserIdentity';
import { AppSettingsRepository } from '../../common/base/settings/AppSettingsRepository';

export class GetAppSettingsQuery extends Query<AppSettings> {}

export class GetAppSettingsQueryHandler implements RequestHandler<GetAppSettingsQuery, AppSettings> {
    constructor(private readonly settings: AppSettingsRepository) {}

    async handle(_query: GetAppSettingsQuery, identity: Identity): Promise<AppSettings> {
        requireSuperadmin(identity);
        return this.settings.getSettings();
    }
}
