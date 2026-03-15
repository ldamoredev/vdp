import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { bodyMeasurements } from "../schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function bodyRoutes(app: FastifyInstance) {
  // List measurements
  app.get("/api/v1/health/body", async (request, reply) => {
    try {
      const { type, from, to, limit } = request.query as {
        type?: string;
        from?: string;
        to?: string;
        limit?: string;
      };

      const conditions = [];
      if (type) conditions.push(eq(bodyMeasurements.measurementType, type));
      if (from) conditions.push(gte(bodyMeasurements.recordedAt, from));
      if (to) conditions.push(lte(bodyMeasurements.recordedAt, to));

      const result = await db
        .select()
        .from(bodyMeasurements)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(bodyMeasurements.recordedAt))
        .limit(Number(limit) || 50);

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch measurements" });
    }
  });

  // Log measurement
  app.post("/api/v1/health/body", async (request, reply) => {
    try {
      const body = request.body as {
        measurementType: string;
        value: number;
        unit?: string;
        date?: string;
        notes?: string;
      };

      if (!body.measurementType || body.value == null) {
        return reply.status(400).send({ error: "measurementType and value are required" });
      }

      const unitMap: Record<string, string> = {
        weight: "kg", height: "cm", body_fat: "%",
        blood_pressure_sys: "mmHg", blood_pressure_dia: "mmHg", glucose: "mg/dL",
      };

      const [measurement] = await db
        .insert(bodyMeasurements)
        .values({
          measurementType: body.measurementType,
          value: String(body.value),
          unit: body.unit || unitMap[body.measurementType] || "unit",
          recordedAt: body.date || new Date().toISOString().slice(0, 10),
          notes: body.notes || null,
        })
        .returning();

      return reply.status(201).send(measurement);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to log measurement" });
    }
  });

  // Delete measurement
  app.delete<{ Params: { id: string } }>("/api/v1/health/body/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [deleted] = await db
        .delete(bodyMeasurements)
        .where(eq(bodyMeasurements.id, id))
        .returning();

      if (!deleted) return reply.status(404).send({ error: "Measurement not found" });
      return reply.send({ message: "Measurement deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete measurement" });
    }
  });
}
