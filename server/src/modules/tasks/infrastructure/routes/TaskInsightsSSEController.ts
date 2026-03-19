import { FastifyInstance, FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { HttpController } from '../../../common/http/HttpController';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';

/**
 * SSE endpoint for real-time task insights.
 *
 * Clients connect via EventSource and receive:
 * - Initial snapshot of unread insights
 * - Live insights as they are generated (task completed, stuck, overloaded, etc.)
 * - Periodic heartbeats to keep the connection alive
 */
export class TaskInsightsSSEController implements HttpController {
    constructor(
        private broadcaster: SSEBroadcaster,
        private insightsStore: TaskInsightsStore,
    ) {}

    register(app: FastifyInstance): void {
        const plugin: FastifyPluginCallback = (insightsApp, _opts, done) => {
            insightsApp.get('/stream', this.stream.bind(this));
            done();
        };

        app.register(plugin, { prefix: '/api/v1/tasks/insights' });
    }

    private async stream(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Prevent Fastify from managing the response lifecycle
        reply.hijack();

        const res = reply.raw;
        const origin = request.headers.origin;

        // reply.hijack() bypasses Fastify's plugin pipeline (including CORS),
        // so we must set CORS headers manually on the raw response.
        this.broadcaster.addClient(res, origin);

        // Send current unread insights as initial payload
        const snapshot = this.insightsStore.getSnapshot();
        if (snapshot.unread.length > 0) {
            res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
        }

        // Cleanup on disconnect
        request.socket.on('close', () => {
            this.broadcaster.removeClient(res);
        });
    }
}
