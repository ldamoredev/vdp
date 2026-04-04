import { FastifyInstance } from 'fastify';

import { AuditLogRepository } from '../base/auth/AuditLogRepository';
import { AuthContextStorage } from '../auth/AuthContextStorage';

export class RequestAuditLogger {
    constructor(private readonly auditLogs: AuditLogRepository, private readonly authContextStorage: AuthContextStorage) {}

    plugin = async (fastify: FastifyInstance) => {
        fastify.addHook('onResponse', async (request, reply) => {
            const auth = this.authContextStorage.getRequestAuth();
            if (!auth.userId) return;
            if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
            if (request.url.startsWith('/api/health')) return;

            const params = request.params && typeof request.params === 'object'
                ? request.params as Record<string, unknown>
                : undefined;

            await this.auditLogs.createLog({
                actorUserId: auth.userId,
                actorSessionId: auth.sessionId,
                action: `http.${request.method.toLowerCase()}`,
                resourceType: request.routeOptions.url ?? request.url.split('?')[0],
                resourceId: typeof params?.id === 'string' ? params.id : null,
                metadata: {
                    url: request.url,
                    statusCode: reply.statusCode,
                },
            });
        });
    };
}
