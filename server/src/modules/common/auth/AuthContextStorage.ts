import { AsyncLocalStorage } from 'node:async_hooks';
import { AuthContext } from './AuthContext';

export class AuthContextStorage {
    storage: AsyncLocalStorage<AuthContext>

    constructor() {
        this.storage = new AsyncLocalStorage<AuthContext>();
    }

    unauthenticatedAuth(): AuthContext {
        return {
            isAuthenticated: false,
            userId: null,
            sessionId: null,
            role: null,
            email: null,
            displayName: null,
        };
    }

    setAuthContext(context: AuthContext): void {
        this.storage.enterWith(context);
    }

    getRequestAuth(): AuthContext {
        return this.storage.getStore() ?? this.unauthenticatedAuth();
    }
}