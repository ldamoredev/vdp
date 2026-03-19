import { ServerResponse } from 'http';

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

    constructor(heartbeatMs = 30_000) {
        this.heartbeatMs = heartbeatMs;
    }

    /**
     * Add a new SSE client connection.
     * Writes SSE headers and sends initial heartbeat.
     */
    addClient(res: ServerResponse): void {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // Disable nginx buffering
        });

        // Initial heartbeat so the client knows the connection is alive
        res.write(': heartbeat\n\n');

        this.clients.add(res);
        this.ensureHeartbeat();

        console.log(`[SSE] Client connected (total: ${this.clients.size})`);
    }

    /**
     * Remove a client connection (call on socket close).
     */
    removeClient(res: ServerResponse): void {
        this.clients.delete(res);
        console.log(`[SSE] Client disconnected (total: ${this.clients.size})`);

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
