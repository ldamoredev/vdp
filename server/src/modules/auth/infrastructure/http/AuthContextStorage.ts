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

    getAuthContext(): AuthContext {
        return this.storage.getStore() ?? this.unauthenticatedAuth();
    }

    /**
     * Run a callback within an explicit auth context scope.
     * Unlike enterWith(), run() creates a proper async context boundary
     * that survives across all async operations (HTTP calls, timers, etc.).
     */
    runWithContext<T>(context: AuthContext, fn: () => T): T {
        return this.storage.run(context, fn);
    }
}