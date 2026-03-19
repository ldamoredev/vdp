import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { Core } from '../../../Core';

const chatBodySchema = z.object({
    message: z.string().trim().min(1),
    conversationId: z.string().uuid().optional(),
});

export class TasksAgentController {
    constructor(private core: Core) {}

    plugin = (app: FastifyInstance, _opts: unknown, done: () => void) => {
        app.post('/chat', this.chat.bind(this));
        done();
    };

    private async chat(request: FastifyRequest, reply: FastifyReply) {
        const body = chatBodySchema.safeParse(request.body);
        if (!body.success) {
            return reply.status(400).send({ error: body.error.flatten() });
        }

        const agent = this.core.agentRegistry.get('tasks');
        if (!agent) {
            return reply.status(503).send({ error: 'Tasks agent is not registered' });
        }

        reply.hijack();
        const res = reply.raw;
        const origin = request.headers.origin ?? '*';

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': origin,
            Vary: 'Origin',
        });

        const send = (event: string, data: Record<string, unknown>) => {
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
            }
        };

        try {
            await agent.chat({
                message: body.data.message,
                conversationId: body.data.conversationId,
                callbacks: {
                    onText: (text) => send('text', { text }),
                    onToolUse: (tool, input) => send('tool_use', { tool, input }),
                    onToolResult: (tool, result) => {
                        send('tool_result', { tool, summary: summarizeToolResult(result) });
                    },
                    onDone: (conversationId) => {
                        send('done', { conversationId });
                        if (!res.writableEnded) {
                            res.write('data: [DONE]\n\n');
                            res.end();
                        }
                    },
                    onError: (error) => {
                        send('error', { error });
                        if (!res.writableEnded) {
                            res.write('data: [DONE]\n\n');
                            res.end();
                        }
                    },
                },
            });
        } catch (error: any) {
            send('error', { error: error.message || 'Agent error' });
            if (!res.writableEnded) {
                res.write('data: [DONE]\n\n');
                res.end();
            }
        }
    }
}

function summarizeToolResult(result: string): string {
    try {
        const parsed = JSON.parse(result) as {
            error?: string;
            message?: string;
            tasks?: unknown[];
        } | unknown[];

        if (Array.isArray(parsed)) return `${parsed.length} resultados`;
        if (parsed.error) return `Error: ${parsed.error}`;
        if (parsed.message) return parsed.message;
        if (Array.isArray(parsed.tasks)) return `${parsed.tasks.length} tareas`;
        return 'Completado';
    } catch {
        return 'Completado';
    }
}
