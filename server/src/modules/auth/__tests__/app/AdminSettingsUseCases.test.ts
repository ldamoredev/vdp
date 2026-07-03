import { Identity } from '@nbottarini/cqbus';
import { describe, expect, it } from 'vitest';

import { FakeAppSettingsRepository } from '../../../common/__tests__/fakes/FakeAppSettingsRepository';
import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { ForbiddenHttpError, UnauthorizedHttpError } from '../../../common/http/errors';
import { GetAppSettingsQuery, GetAppSettingsQueryHandler } from '../../app/GetAppSettingsQuery';
import { UpdateAppSettingsCommand, UpdateAppSettingsCommandHandler } from '../../app/UpdateAppSettingsCommand';
import { FakeAuditLogRepository } from '../fakes/FakeAuditLogRepository';

const superadmin = new UserIdentity(
    'admin-1',
    'admin@vdp.local',
    'Admin',
    ['superadmin'],
    'session-1',
);
const user = new UserIdentity('user-1', 'user@vdp.local', 'User', ['user'], 'session-2');
const anonymous = {
    isAuthenticated: false,
    authenticationType: 'none',
    roles: [],
    properties: {},
    name: 'anonymous',
} as Identity;

describe('admin settings use cases', () => {
    it('returns default settings for a superadmin', async () => {
        const settings = new FakeAppSettingsRepository();

        const result = await new GetAppSettingsQueryHandler(settings)
            .handle(new GetAppSettingsQuery(), superadmin);

        expect(result).toEqual({
            registrationEnabled: true,
            chatEnabledForUsers: true,
        });
    });

    it('merges a patch and writes an audit log', async () => {
        const settings = new FakeAppSettingsRepository();
        const auditLogs = new FakeAuditLogRepository();

        const result = await new UpdateAppSettingsCommandHandler(settings, auditLogs)
            .handle(new UpdateAppSettingsCommand({ registrationEnabled: false }), superadmin);

        expect(result).toEqual({
            registrationEnabled: false,
            chatEnabledForUsers: true,
        });
        expect(settings.updates).toEqual([
            {
                patch: { registrationEnabled: false },
                updatedByUserId: 'admin-1',
            },
        ]);
        expect(auditLogs.logs).toMatchObject([
            {
                actorUserId: 'admin-1',
                actorSessionId: 'session-1',
                action: 'admin.settings_updated',
                resourceType: 'app_settings',
                metadata: { registrationEnabled: false },
            },
        ]);
    });

    it('rejects non-superadmin identities', async () => {
        const settings = new FakeAppSettingsRepository();
        const auditLogs = new FakeAuditLogRepository();

        await expect(
            new GetAppSettingsQueryHandler(settings).handle(new GetAppSettingsQuery(), user),
        ).rejects.toThrow(ForbiddenHttpError);
        await expect(
            new UpdateAppSettingsCommandHandler(settings, auditLogs)
                .handle(new UpdateAppSettingsCommand({ chatEnabledForUsers: false }), user),
        ).rejects.toThrow(ForbiddenHttpError);
    });

    it('rejects anonymous identities', async () => {
        const settings = new FakeAppSettingsRepository();

        await expect(
            new GetAppSettingsQueryHandler(settings).handle(new GetAppSettingsQuery(), anonymous),
        ).rejects.toThrow(UnauthorizedHttpError);
    });
});
