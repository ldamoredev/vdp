import { ExecutionContext } from '@nbottarini/cqbus';

import { AuthContext } from '../../http/AuthContext';
import { UnauthorizedHttpError } from '../../http/errors';
import { UserIdentity } from './UserIdentity';

export function executionContextFromAuth(auth: AuthContext): ExecutionContext {
    const identity = UserIdentity.fromAuthContext(auth);
    if (!identity) throw new UnauthorizedHttpError('Not authenticated');
    return ExecutionContext.empty().withIdentity(identity);
}
