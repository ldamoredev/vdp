import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AuthContextStorage } from './AuthContextStorage';
import { AuthContext } from './AuthContext';
import { HttpMiddleWare } from '../../../common/http/HttpMiddleWare';
import { SessionService } from '../../services/SessionService';
import { UserRepository } from '../../domain/UserRepository';
import { UnauthorizedHttpError } from '../../../common/http/errors';

type PublicPath = '/api/health' | '/api/auth/login' | '/api/auth/register' | '/api/auth/setup';

export class SessionTokenAuthenticationMiddleware extends HttpMiddleWare {
    private readonly PUBLIC_PATHS: PublicPath[] = [
        '/api/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/setup',
    ];

    constructor(
        private readonly authContextStorage: AuthContextStorage,
        private readonly sessionService: SessionService,
        private readonly users: UserRepository,
    ) {
        super();
    }

    async plugin(fastify: FastifyInstance) {
        fastify.decorateRequest('auth');

        fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            const sessionToken = this.getSessionToken(request);

            if (!sessionToken) {
                if (this.isPublicPath(request.url)) return;
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'Missing session',
                });
            }

            try {
                const session = await this.sessionService.findByToken(sessionToken);
                if (!session) {
                    throw new UnauthorizedHttpError('Invalid session');
                }

                const user = await this.users.findById(session.userId);
                if (!user || !user.isActive) {
                    throw new UnauthorizedHttpError('Session expired or invalid');
                }

                const authenticatedContext: AuthContext = {
                    isAuthenticated: true,
                    userId: user.id,
                    sessionId: session.id,
                    role: user.role,
                    email: user.email,
                    displayName: user.displayName,
                };

                request.auth = authenticatedContext;
                this.authContextStorage.setAuthContext({ ...authenticatedContext });

                void this.sessionService.touchIfStale(session.id, session.lastSeenAt);
            } catch (error) {
                if (this.isPublicPath(request.url)) return;
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: error instanceof Error ? error.message : 'Invalid session',
                });
            }
        });
    }

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
