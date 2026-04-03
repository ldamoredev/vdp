import { AsyncLocalStorage } from 'node:async_hooks';

export const DEFAULT_TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

export type RequestAuthContext = {
    isAuthenticated: boolean;
    userId: string | null;
    sessionId: string | null;
    role: 'user' | null;
    email: string | null;
    displayName: string | null;
};

const requestAuthStorage = new AsyncLocalStorage<RequestAuthContext>();

export function createUnauthenticatedRequestAuth(): RequestAuthContext {
    return {
        isAuthenticated: false,
        userId: null,
        sessionId: null,
        role: null,
        email: null,
        displayName: null,
    };
}

export function runWithRequestAuth<T>(
    context: RequestAuthContext,
    callback: () => T,
): T {
    return requestAuthStorage.run(context, callback);
}

export function setRequestAuth(context: RequestAuthContext): void {
    requestAuthStorage.enterWith(context);
}

export function getRequestAuth(): RequestAuthContext {
    return requestAuthStorage.getStore() ?? createUnauthenticatedRequestAuth();
}

export function getScopedUserId(): string {
    return getRequestAuth().userId ?? DEFAULT_TEST_USER_ID;
}
