import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { AuthContext } from '../../../common/http/AuthContext';
import { HttpMiddleWare } from '../../../common/http/HttpMiddleWare';
import { SessionService } from '../../services/SessionService';
import { UserRepository } from '../../domain/UserRepository';
import { UnauthorizedHttpError } from '../../../common/http/errors';
import { SESSION_COOKIE_NAME, sessionCookieClearOptions } from './session-cookie';

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

            if (this.isPublicPath(request.url) && !request.url.startsWith('/api')) {
                // Static assets and SPA routes never need the session resolved.
                return;
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
                if (this.hasCookieToken(request)) {
                    // Stale/invalid browser cookie: clear it so the client re-logs cleanly.
                    reply.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions());
                }
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: error instanceof Error ? error.message : 'Invalid session',
                });
            }
        });
    }

    private isPublicPath(url: string): boolean {
        // Everything outside /api is the SPA (static assets + client routes):
        // authentication there is enforced client-side and per API call.
        if (url !== '/api' && !url.startsWith('/api/')) return true;
        return this.PUBLIC_PATHS.some((path) => url === path || url.startsWith(`${path}?`));
    }

    private hasCookieToken(request: FastifyRequest): boolean {
        const cookieHeader = request.headers.cookie;
        return typeof cookieHeader === 'string' && cookieHeader.includes(`${SESSION_COOKIE_NAME}=`);
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
