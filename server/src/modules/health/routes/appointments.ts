import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { appointments } from "../schema.js";
import { eq, and, gte, asc, desc } from "drizzle-orm";

export async function appointmentsRoutes(app: FastifyInstance) {
  // List appointments
  app.get("/api/v1/health/appointments", async (request, reply) => {
    try {
      const { status } = request.query as { status?: string };

      const conditions = [];
      if (status) {
        conditions.push(eq(appointments.status, status));
      }

      const result = await db
        .select()
        .from(appointments)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(appointments.scheduledAt));

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch appointments" });
    }
  });

  // Get single appointment
  app.get<{ Params: { id: string } }>("/api/v1/health/appointments/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await db.select().from(appointments).where(eq(appointments.id, id));
      if (result.length === 0) return reply.status(404).send({ error: "Appointment not found" });
      return reply.send(result[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch appointment" });
    }
  });

  // Create appointment
  app.post("/api/v1/health/appointments", async (request, reply) => {
    try {
      const body = request.body as {
        title: string;
        doctorName?: string;
        specialty?: string;
        location?: string;
        scheduledAt: string;
        durationMinutes?: number;
        notes?: string;
      };

      if (!body.title || !body.scheduledAt) {
        return reply.status(400).send({ error: "title and scheduledAt are required" });
      }

      const [apt] = await db
        .insert(appointments)
        .values({
          title: body.title,
          doctorName: body.doctorName || null,
          specialty: body.specialty || null,
          location: body.location || null,
          scheduledAt: new Date(body.scheduledAt),
          durationMinutes: body.durationMinutes || null,
          notes: body.notes || null,
        })
        .returning();

      return reply.status(201).send(apt);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create appointment" });
    }
  });

  // Update appointment
  app.put<{ Params: { id: string } }>("/api/v1/health/appointments/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body as Partial<{
        title: string;
        doctorName: string;
        specialty: string;
        location: string;
        scheduledAt: string;
        durationMinutes: number;
        notes: string;
        status: string;
      }>;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) {
          updateData[k] = k === "scheduledAt" ? new Date(v as string) : v;
        }
      }

      const [updated] = await db
        .update(appointments)
        .set(updateData)
        .where(eq(appointments.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: "Appointment not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update appointment" });
    }
  });

  // Delete appointment
  app.delete<{ Params: { id: string } }>("/api/v1/health/appointments/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [deleted] = await db
        .delete(appointments)
        .where(eq(appointments.id, id))
        .returning();

      if (!deleted) return reply.status(404).send({ error: "Appointment not found" });
      return reply.send({ message: "Appointment deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete appointment" });
    }
  });
}
