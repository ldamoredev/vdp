import { UserRole } from '../modules/common/http/AuthContext';

export type TestUser = {
    id: string;
    email: string;
    displayName: string;
    role?: UserRole;
};

export const PRIMARY_TEST_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@vdp.local',
    displayName: 'Test User',
} as const satisfies TestUser;

export const SECONDARY_TEST_USER = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'other@vdp.local',
    displayName: 'Other User',
} as const satisfies TestUser;

export const SUPERADMIN_TEST_USER = {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@vdp.local',
    displayName: 'Admin User',
    role: 'superadmin',
} as const satisfies TestUser;

export const DEFAULT_TEST_USERS = [PRIMARY_TEST_USER] as const;
export const ALL_TEST_USERS = [PRIMARY_TEST_USER, SECONDARY_TEST_USER, SUPERADMIN_TEST_USER] as const;

export const TEST_USER_ID_HEADER = 'x-test-user-id';

export function getTestUser(userId: string): TestUser {
    return ALL_TEST_USERS.find((user) => user.id === userId) ?? PRIMARY_TEST_USER;
}
