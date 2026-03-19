import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';

/**
 * SSE endpoint for real-time task insights.
 *
 * Clients connect via EventSource and receive:
 * - Initial snapshot of unread insights
 * - Live insights as they are generated (task completed, stuck, overloaded, etc.)
 * - Periodic heartbeats to keep the connection alive
 */
export class TaskInsightsSSEController {
    constructor(
        private broadcaster: SSEBroadcaster,
        private insightsStore: TaskInsightsStore,
    ) {}

    plugin = (app: FastifyInstance, _opts: any, done: () => void) => {
        app.get('/stream', this.stream.bind(this));
        done();
    };

    private async stream(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Prevent Fastify from managing the response lifecycle
        reply.hijack();

        const res = reply.raw;

        // Register client in broadcaster (sets SSE headers + initial heartbeat)
        this.broadcaster.addClient(res);

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
