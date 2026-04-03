import 'fastify';

declare module 'fastify' {
    interface FastifyRequest {
        auth: {
            isAuthenticated: boolean;
            userId: string | null;
            sessionId: string | null;
            role: 'user' | null;
            email: string | null;
            displayName: string | null;
        };
    }
}
