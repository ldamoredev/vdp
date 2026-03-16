import { FastifyInstance } from "fastify";
import { db } from "../core/db/client.js";
import { agentConversations, agentMessages } from "../core/schema.js";
import { eq, asc, desc } from "drizzle-orm";
import { agentRegistry } from "./registry.js";
import type { DomainName } from "../core/event-bus/index.js";

/**
 * Shared SSE agent routes.
 * One handler serves ALL domains by resolving the agent from the registry.
 * Replaces per-domain agent route files.
 */
export async function agentRoutes(app: FastifyInstance) {
  // Chat with any domain agent (SSE stream)
  app.post<{ Params: { domain: string } }>(
    "/api/v1/:domain/agent/chat",
    async (request, reply) => {
      const { domain } = request.params;
      const agent = agentRegistry.get(domain as DomainName);

      if (!agent) {
        return reply.status(404).send({ error: `No agent for domain: ${domain}` });
      }

      const { message, conversationId } = request.body as {
        message: string;
        conversationId?: string;
      };

      if (!message) {
        return reply.status(400).send({ error: "Message is required" });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      const send = (event: string, data: Record<string, unknown>) => {
        reply.raw.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
      };

      await agent.chat({
        message,
        conversationId,
        callbacks: {
          onText: (text) => send("text", { text }),
          onToolUse: (tool, input) => send("tool_use", { tool, input }),
          onToolResult: (tool, result) => {
            try {
              const parsed = JSON.parse(result);
              const summary = Array.isArray(parsed)
                ? `${parsed.length} resultados`
                : parsed.error
                  ? `Error: ${parsed.error}`
                  : "Completado";
              send("tool_result", { tool, summary });
            } catch {
              send("tool_result", { tool, summary: "Completado" });
            }
          },
          onDone: (convId) => {
            send("done", { conversationId: convId });
            reply.raw.write("data: [DONE]\n\n");
            reply.raw.end();
          },
          onError: (error) => {
            send("error", { error });
            reply.raw.write("data: [DONE]\n\n");
            reply.raw.end();
          },
        },
      });
    }
  );

  // List conversations for a domain
  app.get<{ Params: { domain: string } }>(
    "/api/v1/:domain/agent/conversations",
    async (request, reply) => {
      const { domain } = request.params;
      const convs = await db
        .select()
        .from(agentConversations)
        .where(eq(agentConversations.domain, domain))
        .orderBy(desc(agentConversations.updatedAt))
        .limit(50);
      return reply.send(convs);
    }
  );

  // Get conversation messages
  app.get<{ Params: { domain: string; id: string } }>(
    "/api/v1/:domain/agent/conversations/:id/messages",
    async (request, reply) => {
      const { id } = request.params;
      const msgs = await db
        .select()
        .from(agentMessages)
        .where(eq(agentMessages.conversationId, id))
        .orderBy(asc(agentMessages.createdAt));
      return reply.send(msgs);
    }
  );
}
