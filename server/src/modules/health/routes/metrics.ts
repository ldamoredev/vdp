import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { healthMetrics } from "../schema.js";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export async function metricsRoutes(app: FastifyInstance) {
  // List metrics with filters
  app.get("/api/v1/health/metrics", async (request, reply) => {
    try {
      const { metricType, from, to, limit } = request.query as {
        metricType?: string;
        from?: string;
        to?: string;
        limit?: string;
      };

      const conditions = [];
      if (metricType) conditions.push(eq(healthMetrics.metricType, metricType));
      if (from) conditions.push(gte(healthMetrics.recordedAt, new Date(from)));
      if (to) conditions.push(lte(healthMetrics.recordedAt, new Date(to + "T23:59:59")));

      const result = await db
        .select()
        .from(healthMetrics)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(healthMetrics.recordedAt))
        .limit(Number(limit) || 50);

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch metrics" });
    }
  });

  // Log a metric
  app.post("/api/v1/health/metrics", async (request, reply) => {
    try {
      const { metricType, value, unit, recordedAt, notes, source } = request.body as {
        metricType: string;
        value: number;
        unit?: string;
        recordedAt?: string;
        notes?: string;
        source?: string;
      };

      if (!metricType || value == null) {
        return reply.status(400).send({ error: "metricType and value are required" });
      }

      const unitMap: Record<string, string> = {
        sleep_hours: "hours", steps: "steps", weight: "kg",
        heart_rate: "bpm", water_ml: "ml", calories: "kcal",
        mood: "scale", energy: "scale",
      };

      const [metric] = await db
        .insert(healthMetrics)
        .values({
          metricType,
          value: String(value),
          unit: unit || unitMap[metricType] || "unit",
          recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
          source: source || "manual",
          notes: notes || null,
        })
        .returning();

      return reply.status(201).send(metric);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to log metric" });
    }
  });

  // Delete a metric
  app.delete<{ Params: { id: string } }>("/api/v1/health/metrics/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [deleted] = await db
        .delete(healthMetrics)
        .where(eq(healthMetrics.id, id))
        .returning();

      if (!deleted) return reply.status(404).send({ error: "Metric not found" });
      return reply.send({ message: "Metric deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete metric" });
    }
  });

  // Today's summary
  app.get("/api/v1/health/today", async (_request, reply) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const startOfDay = new Date(today + "T00:00:00");
      const endOfDay = new Date(today + "T23:59:59");

      const metrics = await db
        .select()
        .from(healthMetrics)
        .where(
          and(
            gte(healthMetrics.recordedAt, startOfDay),
            lte(healthMetrics.recordedAt, endOfDay)
          )
        )
        .orderBy(desc(healthMetrics.recordedAt));

      // Group by type, take latest of each
      const grouped: Record<string, any> = {};
      for (const m of metrics) {
        if (!grouped[m.metricType]) {
          grouped[m.metricType] = m;
        }
      }

      return reply.send({ date: today, metrics: grouped, all: metrics });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch today's summary" });
    }
  });

  // Weekly aggregation
  app.get("/api/v1/health/stats/weekly", async (_request, reply) => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const result = await db
        .select({
          metricType: healthMetrics.metricType,
          avg: sql<string>`ROUND(AVG(${healthMetrics.value}::numeric), 2)::text`,
          min: sql<string>`MIN(${healthMetrics.value}::numeric)::text`,
          max: sql<string>`MAX(${healthMetrics.value}::numeric)::text`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(healthMetrics)
        .where(gte(healthMetrics.recordedAt, weekAgo))
        .groupBy(healthMetrics.metricType);

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch weekly stats" });
    }
  });
}
