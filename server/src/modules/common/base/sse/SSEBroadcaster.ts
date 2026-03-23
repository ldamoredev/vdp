import { ServerResponse } from 'http';
import { Logger } from '../observability/logging/Logger';
import { NoOpLogger } from '../../infrastructure/observability/logging/NoOpLogger';

/**
 * Reusable SSE broadcaster for server-to-client push.
 *
 * Manages connected clients, broadcasts events, and sends
 * periodic heartbeats to keep connections alive.
 *
 * Usage:
 *   const broadcaster = new SSEBroadcaster();
 *   // In route handler:
 *   broadcaster.addClient(reply.raw);
 *   // When something happens:
 *   broadcaster.broadcast('insight', { title: '...' });
 */
export class SSEBroadcaster {
    private clients = new Set<ServerResponse>();
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private heartbeatMs: number;

    constructor(
        private readonly logger: Logger = new NoOpLogger(),
        heartbeatMs = 30_000,
    ) {
        this.heartbeatMs = heartbeatMs;
    }

    /**
     * Add a new SSE client connection.
     * Writes SSE headers and sends initial heartbeat.
     */
    addClient(res: ServerResponse, origin?: string): void {
        const headers: Record<string, string> = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        };

        // When used with reply.hijack(), Fastify's CORS plugin is bypassed,
        // so we set CORS headers manually.
        if (origin) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Access-Control-Allow-Credentials'] = 'true';
        }

        res.writeHead(200, headers);

        // Initial heartbeat so the client knows the connection is alive
        res.write(': heartbeat\n\n');

        this.clients.add(res);
        this.ensureHeartbeat();

        this.logger.info('sse client connected', { clients: this.clients.size });
    }

    /**
     * Remove a client connection (call on socket close).
     */
    removeClient(res: ServerResponse): void {
        this.clients.delete(res);
        this.logger.info('sse client disconnected', { clients: this.clients.size });

        if (this.clients.size === 0) {
            this.stopHeartbeat();
        }
    }

    /**
     * Broadcast a named event to all connected clients.
     * Format: `event: <name>\ndata: <json>\n\n`
     */
    broadcast(event: string, data: unknown): void {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

        for (const client of this.clients) {
            try {
                client.write(payload);
            } catch {
                // Client disconnected unexpectedly — clean up
                this.clients.delete(client);
            }
        }
    }

    /**
     * Number of connected clients.
     */
    get clientCount(): number {
        return this.clients.size;
    }

    /**
     * Shutdown: close all connections and stop heartbeat.
     */
    shutdown(): void {
        this.stopHeartbeat();
        for (const client of this.clients) {
            try {
                client.end();
            } catch {
                // Ignore
            }
        }
        this.clients.clear();
    }

    // ─── Heartbeat ─────────────────────────────────────────

    private ensureHeartbeat(): void {
        if (this.heartbeatInterval) return;

        this.heartbeatInterval = setInterval(() => {
            for (const client of this.clients) {
                try {
                    client.write(': heartbeat\n\n');
                } catch {
                    this.clients.delete(client);
                }
            }
        }, this.heartbeatMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
}
