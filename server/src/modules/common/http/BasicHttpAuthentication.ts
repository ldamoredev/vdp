import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export class BasicHttpAuthentication {
    private PUBLIC_PATHS = ['/api/health'];

    apiKeyGuard = async (fastify: FastifyInstance) => {
        const accessSecret = process.env.ACCESS_SECRET;

        if (!accessSecret) {
            fastify.log.warn('ACCESS_SECRET is not set — API key guard is disabled');
            return;
        }

        fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
            if (this.isPublicPath(request.url)) return;

            const apiKey = request.headers['x-api-key'];

            if (apiKey !== accessSecret) {
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'Invalid or missing API key',
                });
            }
        });
    };

    private isPublicPath(url: string): boolean {
        return this.PUBLIC_PATHS.some((path) => url === path || url.startsWith(`${path}?`));
    }
}

