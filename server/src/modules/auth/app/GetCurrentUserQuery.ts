import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';

export type CurrentUser = {
    id: string;
    email: string | null;
    displayName: string | null;
    role: 'user' | null;
};

export type CurrentUserResponse = {
    user: CurrentUser;
};

export class GetCurrentUserQuery extends Query<CurrentUserResponse> {}

export class GetCurrentUserQueryHandler implements RequestHandler<GetCurrentUserQuery, CurrentUserResponse> {
    async handle(_query: GetCurrentUserQuery, identity: Identity): Promise<CurrentUserResponse> {
        const user = requireUserIdentity(identity);
        return {
            user: {
                id: user.userId,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
            },
        };
    }
}
