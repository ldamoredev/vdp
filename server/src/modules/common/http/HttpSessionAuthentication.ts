import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AuthService } from '../auth/AuthService';
import { AuthContextStorage } from '../auth/AuthContextStorage';
import { AuthContext } from '../auth/AuthContext';

type PublicPath = '/api/health' | '/api/auth/login' | '/api/auth/register' | '/api/auth/setup';

export class HttpSessionAuthentication {
    private readonly PUBLIC_PATHS: PublicPath[] = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/setup',
    ];

    constructor(private readonly authService: AuthService, private readonly authContextStorage: AuthContextStorage) {}

    plugin = async (fastify: FastifyInstance) => {
        fastify.decorateRequest('auth');

        fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            const context = this.authContextStorage.unauthenticatedAuth();

            request.auth = { ...context };
            this.authContextStorage.setAuthContext({ ...context });

            const sessionToken = this.getSessionToken(request);

            if (!sessionToken) {
                if (this.isPublicPath(request.url)) return;
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'Missing session',
                });
            }

            try {
                const { user, sessionId } = await this.authService.getAuthenticatedUser(sessionToken);
                const authenticatedContext: AuthContext = {
                    isAuthenticated: true,
                    userId: user.id,
                    sessionId,
                    role: user.role,
                    email: user.email,
                    displayName: user.displayName,
                };
                request.auth = authenticatedContext;
                this.authContextStorage.setAuthContext({ ...authenticatedContext });
            } catch (error) {
                if (this.isPublicPath(request.url)) {
                    return;
                }

                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: error instanceof Error ? error.message : 'Invalid session',
                });
            }
        });

        fastify.addHook('preHandler', async (request, _reply) => {
            const currentAuth = request.auth ?? this.authContextStorage.unauthenticatedAuth();
            this.authContextStorage.setAuthContext({ ...currentAuth });
        });
    };

    private isPublicPath(url: string): boolean {
        return this.PUBLIC_PATHS.some((path) => url === path || url.startsWith(`${path}?`));
    }

    private getSessionToken(request: FastifyRequest): string | null {
        const headerToken = request.headers['x-session-token'];
        if (typeof headerToken === 'string' && headerToken) {
            return headerToken;
        }

        const cookieHeader = request.headers.cookie;
        if (!cookieHeader) return null;

        const match = cookieHeader.match(/(?:^|;\s*)vdp_session=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}
