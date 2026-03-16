import { FastifyInstance } from "fastify";
import { statsQuerySchema } from "@vdp/shared";
import { walletService } from "../service.js";

export async function statsRoutes(app: FastifyInstance) {
  app.get("/api/v1/stats/summary", async (request, reply) => {
    try {
      const parsed = statsQuerySchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await walletService.getSummary(parsed.data);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch summary stats" });
    }
  });

  app.get("/api/v1/stats/by-category", async (request, reply) => {
    try {
      const parsed = statsQuerySchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await walletService.getSpendingByCategory(parsed.data);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch category stats" });
    }
  });

  app.get("/api/v1/stats/monthly-trend", async (_request, reply) => {
    try {
      const result = await walletService.getMonthlyTrend();
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch monthly trend" });
    }
  });
}
