import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AuthService } from '../auth/AuthService';
import { RequestAuthContext, createUnauthenticatedRequestAuth, setRequestAuth } from './request-auth';

type PublicPath = '/api/health' | '/api/auth/login' | '/api/auth/register' | '/api/auth/setup';

export class SessionAuthentication {
    private readonly PUBLIC_PATHS: PublicPath[] = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/setup',
    ];

    constructor(private readonly authService: AuthService) {}

    plugin = async (fastify: FastifyInstance) => {
        fastify.decorateRequest('auth');

        fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            const context = createUnauthenticatedRequestAuth();

            request.auth = { ...context };
            setRequestAuth({ ...context });

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
                const authenticatedContext: RequestAuthContext = {
                    isAuthenticated: true,
                    userId: user.id,
                    sessionId,
                    role: user.role,
                    email: user.email,
                    displayName: user.displayName,
                };
                request.auth = authenticatedContext;
                setRequestAuth({ ...authenticatedContext });
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
            const currentAuth = request.auth ?? createUnauthenticatedRequestAuth();
            setRequestAuth({ ...currentAuth });
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
