import { AuthContextStorage } from '../http/AuthContextStorage';
import { UnauthorizedHttpError } from '../http/errors';

export function requireAuthenticatedUser(authContextStorage: AuthContextStorage): string {
    const auth = authContextStorage.getAuthContext();
    if (!auth.isAuthenticated || !auth.userId) throw new UnauthorizedHttpError('Not authenticated');
    return auth.userId;
}
