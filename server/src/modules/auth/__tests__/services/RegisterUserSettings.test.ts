import { describe, expect, it, vi } from 'vitest';

import { FakeAppSettingsRepository } from '../../../common/__tests__/fakes/FakeAppSettingsRepository';
import { ForbiddenHttpError } from '../../../common/http/errors';
import { RegisterUser } from '../../services/RegisterUser';

describe('RegisterUser settings', () => {
    it('rejects registration before looking up the email when registration is disabled', async () => {
        const users = { findByEmail: vi.fn() };
        const settings = new FakeAppSettingsRepository();
        await settings.updateSettings({ registrationEnabled: false }, 'admin-1');

        const registerUser = new RegisterUser(
            users as never,
            {} as never,
            {} as never,
            {} as never,
            settings,
        );

        await expect(registerUser.execute({
            email: 'new@vdp.local',
            displayName: 'New User',
            password: 'super-secret-password',
        })).rejects.toThrow(ForbiddenHttpError);
        expect(users.findByEmail).not.toHaveBeenCalled();
    });
});
