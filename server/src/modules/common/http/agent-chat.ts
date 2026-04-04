import { FastifyReply, FastifyRequest } from 'fastify';
import { z, ZodType } from 'zod';
import type { BaseAgent } from '../base/agents/BaseAgent';
import { getAgentErrorCode, type AgentErrorCode } from '../base/agents/AgentError';
import { ServiceUnavailableHttpError } from './errors';
import { parseBody } from './validation';

export const agentChatBodySchema = z.object({
    message: z.string().trim().min(1),
    conversationId: z.string().uuid().optional(),
});

type AgentChatBody = z.infer<typeof agentChatBodySchema>;

type AgentChatHandlerOptions<TBody extends AgentChatBody> = {
    schema?: ZodType<TBody>;
    resolveAgent: (request: FastifyRequest, body: TBody) => BaseAgent | undefined;
    summarizeToolResult?: (result: string) => string;
};

export function createAgentChatHandler<TBody extends AgentChatBody = AgentChatBody>(
    options: AgentChatHandlerOptions<TBody>,
) {
    const schema = options.schema ?? (agentChatBodySchema as ZodType<TBody>);
    const summarizeToolResult = options.summarizeToolResult ?? summarizeAgentToolResult;

    return async function agentChatHandler(request: FastifyRequest, reply: FastifyReply) {
        const body = parseBody(schema, request.body);
        const agent = options.resolveAgent(request, body);

        if (!agent) {
            throw new ServiceUnavailableHttpError('Agent is not registered');
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

        const close = () => {
            if (!res.writableEnded) {
                res.write('data: [DONE]\n\n');
                res.end();
            }
        };

        try {
            await agent.chat({
                userId: request.auth.userId!,
                message: body.message,
                conversationId: body.conversationId,
                callbacks: {
                    onText: (text) => send('text', { text }),
                    onToolUse: (tool, input) => send('tool_use', { tool, input }),
                    onToolResult: (tool, result) => {
                        send('tool_result', {
                            tool,
                            summary: summarizeToolResult(result),
                            result,
                        });
                    },
                    onDone: (conversationId, traceId) => {
                        const langfuseHost = process.env.LANGFUSE_HOST || 'http://localhost:3001';
                        send('done', {
                            conversationId,
                            ...(process.env.NODE_ENV === 'development' && traceId
                                ? { traceUrl: `${langfuseHost}/trace/${traceId}` }
                                : {}),
                        });
                        close();
                    },
                    onError: (error) => {
                        send('error', { error, code: 'unknown' as AgentErrorCode });
                        close();
                    },
                },
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Agent error';
            send('error', { error: message, code: getAgentErrorCode(error) });
            close();
        }
    };
}

export { type AgentErrorCode } from '../base/agents/AgentError';

export function summarizeAgentToolResult(result: string): string {
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
