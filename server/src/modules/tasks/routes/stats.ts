import { FastifyInstance } from "fastify";
import { trendFiltersSchema, domainStatsFiltersSchema } from "@vdp/shared";
import { tasksService } from "../service.js";

export async function tasksStatsRoutes(app: FastifyInstance) {
  // Today's stats
  app.get("/api/v1/tasks/stats/today", async (_request, reply) => {
    try {
      const result = await tasksService.getTodayStats();
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch today stats" });
    }
  });

  // Completion trend (last N days)
  app.get("/api/v1/tasks/stats/trend", async (request, reply) => {
    try {
      const parsed = trendFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await tasksService.getCompletionTrend(parsed.data.days);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch trend" });
    }
  });

  // Completion by domain
  app.get("/api/v1/tasks/stats/by-domain", async (request, reply) => {
    try {
      const parsed = domainStatsFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await tasksService.getCompletionByDomain(parsed.data.from, parsed.data.to);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch domain stats" });
    }
  });

  // Carry-over rate
  app.get("/api/v1/tasks/stats/carry-over", async (request, reply) => {
    try {
      const parsed = trendFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await tasksService.getCarryOverRate(parsed.data.days);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch carry-over rate" });
    }
  });
}
