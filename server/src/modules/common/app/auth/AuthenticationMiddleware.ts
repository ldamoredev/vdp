import { ExecutionContext, Middleware, Request } from '@nbottarini/cqbus';

import { AuthContextStorage } from '../../http/AuthContextStorage';
import { UserIdentity } from './UserIdentity';

export class AuthenticationMiddleware implements Middleware {
    constructor(private readonly authContextStorage: AuthContextStorage) {}

    async exec<T extends Request<R>, R>(
        request: T,
        next: (request: T) => Promise<R>,
        context: ExecutionContext,
    ): Promise<R> {
        const userIdentity = UserIdentity.fromAuthContext(this.authContextStorage.getAuthContext());
        if (userIdentity) {
            context.withIdentity(userIdentity).with('userIdentity', userIdentity);
        }

        return next(request);
    }
}
