import { FastifyInstance } from "fastify";
import { chat } from "../agent/agent";
import { db } from "@vdp/db";
import { agentConversations, agentMessages } from "@vdp/db";
import { eq, asc, desc } from "drizzle-orm";

export async function agentRoutes(app: FastifyInstance) {
  // Chat with agent (SSE stream)
  app.post("/api/v1/agent/chat", async (request, reply) => {
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

    const send = (event: string, data: any) => {
      reply.raw.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
    };

    await chat({
      message,
      conversationId,
      onText: (text) => send("text", { text }),
      onToolUse: (tool, input) => send("tool_use", { tool, input }),
      onToolResult: (tool, result) => {
        // Send a brief summary instead of raw JSON
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
    });
  });

  // List conversations
  app.get("/api/v1/agent/conversations", async (_request, reply) => {
    const convs = await db
      .select()
      .from(agentConversations)
      .orderBy(desc(agentConversations.updatedAt))
      .limit(50);
    return reply.send(convs);
  });

  // Get conversation messages
  app.get<{ Params: { id: string } }>(
    "/api/v1/agent/conversations/:id/messages",
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
