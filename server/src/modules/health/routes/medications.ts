import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { medications, medicationLogs } from "../schema.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function medicationsRoutes(app: FastifyInstance) {
  // List medications
  app.get("/api/v1/health/medications", async (request, reply) => {
    try {
      const { includeInactive } = request.query as { includeInactive?: string };
      const condition = includeInactive === "true" ? undefined : eq(medications.isActive, true);
      const result = await db.select().from(medications).where(condition);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch medications" });
    }
  });

  // Create medication
  app.post("/api/v1/health/medications", async (request, reply) => {
    try {
      const body = request.body as {
        name: string;
        dosage?: string;
        frequency: string;
        timeOfDay?: string;
        startDate?: string;
        endDate?: string;
        notes?: string;
      };

      if (!body.name || !body.frequency) {
        return reply.status(400).send({ error: "name and frequency are required" });
      }

      const [med] = await db
        .insert(medications)
        .values({
          name: body.name,
          dosage: body.dosage || null,
          frequency: body.frequency,
          timeOfDay: body.timeOfDay || null,
          startDate: body.startDate || new Date().toISOString().slice(0, 10),
          endDate: body.endDate || null,
          notes: body.notes || null,
        })
        .returning();

      return reply.status(201).send(med);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create medication" });
    }
  });

  // Update medication
  app.put<{ Params: { id: string } }>("/api/v1/health/medications/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body as Partial<{
        name: string;
        dosage: string;
        frequency: string;
        timeOfDay: string;
        endDate: string;
        isActive: boolean;
        notes: string;
      }>;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) updateData[k] = v;
      }

      const [updated] = await db
        .update(medications)
        .set(updateData)
        .where(eq(medications.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: "Medication not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update medication" });
    }
  });

  // Delete medication (soft)
  app.delete<{ Params: { id: string } }>("/api/v1/health/medications/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [updated] = await db
        .update(medications)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(medications.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: "Medication not found" });
      return reply.send({ message: "Medication deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete medication" });
    }
  });

  // ─── Medication Logs ────────────────────────────────────

  // Get logs for a medication
  app.get<{ Params: { id: string } }>("/api/v1/health/medications/:id/logs", async (request, reply) => {
    try {
      const { id } = request.params;
      const { from, to } = request.query as { from?: string; to?: string };

      const conditions = [eq(medicationLogs.medicationId, id)];
      if (from) conditions.push(gte(medicationLogs.takenAt, new Date(from)));
      if (to) conditions.push(lte(medicationLogs.takenAt, new Date(to + "T23:59:59")));

      const result = await db
        .select()
        .from(medicationLogs)
        .where(and(...conditions))
        .orderBy(desc(medicationLogs.takenAt));

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch medication logs" });
    }
  });

  // Log medication taken/skipped
  app.post<{ Params: { id: string } }>("/api/v1/health/medications/:id/log", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body as {
        skipped?: boolean;
        takenAt?: string;
        notes?: string;
      };

      const [log] = await db
        .insert(medicationLogs)
        .values({
          medicationId: id,
          takenAt: body.takenAt ? new Date(body.takenAt) : new Date(),
          skipped: body.skipped || false,
          notes: body.notes || null,
        })
        .returning();

      return reply.status(201).send(log);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to log medication" });
    }
  });
}
