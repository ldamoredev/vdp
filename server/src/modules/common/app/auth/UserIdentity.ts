import { Identity } from '@nbottarini/cqbus';

import { AuthContext, UserRole } from '../../http/AuthContext';
import { ForbiddenHttpError, UnauthorizedHttpError } from '../../http/errors';

export class UserIdentity implements Identity {
    readonly isAuthenticated = true;
    readonly authenticationType = 'session';
    readonly roles: string[];
    readonly properties: { [name: string]: unknown };

    constructor(
        readonly userId: string,
        readonly email: string | null = null,
        readonly displayName: string | null = null,
        roles: string[] = [],
        readonly sessionId: string | null = null,
    ) {
        this.roles = roles;
        this.properties = {
            userId,
            email,
            displayName,
            sessionId,
            role: this.role,
        };
    }

    get name(): string {
        return this.displayName ?? this.email ?? this.userId;
    }

    get role(): UserRole | null {
        if (this.roles.includes('superadmin')) return 'superadmin';
        return this.roles.includes('user') ? 'user' : null;
    }

    static fromAuthContext(auth: AuthContext): UserIdentity | null {
        if (!auth.isAuthenticated || !auth.userId) return null;
        return new UserIdentity(
            auth.userId,
            auth.email,
            auth.displayName,
            auth.role ? [auth.role] : [],
            auth.sessionId,
        );
    }
}

export function requireUserIdentity(identity: Identity): UserIdentity {
    if (identity instanceof UserIdentity) return identity;
    throw new UnauthorizedHttpError('Not authenticated');
}

export function requireSuperadmin(identity: Identity): UserIdentity {
    const user = requireUserIdentity(identity);
    if (user.role !== 'superadmin') throw new ForbiddenHttpError('Superadmin required');
    return user;
}
