import { Identity } from '@nbottarini/cqbus';

import { AuthContext } from '../../http/AuthContext';
import { UnauthorizedHttpError } from '../../http/errors';

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
    ) {
        this.roles = roles;
        this.properties = {
            userId,
            email,
            displayName,
        };
    }

    get name(): string {
        return this.displayName ?? this.email ?? this.userId;
    }

    static fromAuthContext(auth: AuthContext): UserIdentity | null {
        if (!auth.isAuthenticated || !auth.userId) return null;
        return new UserIdentity(
            auth.userId,
            auth.email,
            auth.displayName,
            auth.role ? [auth.role] : [],
        );
    }
}

export function requireUserIdentity(identity: Identity): UserIdentity {
    if (identity instanceof UserIdentity) return identity;
    throw new UnauthorizedHttpError('Not authenticated');
}
