export const PRIMARY_TEST_USER = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@vdp.local',
    displayName: 'Test User',
} as const;

export const SECONDARY_TEST_USER = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'other@vdp.local',
    displayName: 'Other User',
} as const;

export const DEFAULT_TEST_USERS = [PRIMARY_TEST_USER] as const;
export const ALL_TEST_USERS = [PRIMARY_TEST_USER, SECONDARY_TEST_USER] as const;

export const TEST_USER_ID_HEADER = 'x-test-user-id';

export type TestUser = (typeof ALL_TEST_USERS)[number];

export function getTestUser(userId: string): TestUser {
    return ALL_TEST_USERS.find((user) => user.id === userId) ?? PRIMARY_TEST_USER;
}

