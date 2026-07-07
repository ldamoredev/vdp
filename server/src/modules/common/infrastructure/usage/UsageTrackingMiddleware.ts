import { FastifyInstance } from 'fastify';

import { todayISO } from '../../base/time/dates';
import { UsageEventRepository } from '../../base/usage/UsageEventRepository';
import { HttpMiddleWare } from '../../http/HttpMiddleWare';
import { mapRequestToUsage } from './usage-mapping';

/**
 * Counts owner usage per (surface, action, day) from successful authenticated
 * API responses. Recording is fire-and-forget: a storage failure is logged at
 * debug level and never affects the response (F1.2 hard rule).
 */
export class UsageTrackingMiddleware extends HttpMiddleWare {
    constructor(private readonly usageEvents: UsageEventRepository) {
        super();
    }

    async plugin(fastify: FastifyInstance): Promise<void> {
        fastify.addHook('onResponse', (request, reply, done) => {
            done();
            if (reply.statusCode >= 400) return;

            const auth = request.auth;
            if (!auth?.isAuthenticated || !auth.userId) return;

            const key = mapRequestToUsage(request.method, request.routeOptions?.url);
            if (!key) return;

            this.usageEvents
                .record({
                    ownerUserId: auth.userId,
                    surface: key.surface,
                    action: key.action,
                    occurredOn: todayISO(),
                })
                .catch((error) => request.log.debug({ err: error }, 'usage tracking write failed'));
        });
    }
}
