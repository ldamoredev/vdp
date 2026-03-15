import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { habits, habitCompletions } from "../schema.js";
import { eq, and, gte, desc } from "drizzle-orm";

export async function habitsRoutes(app: FastifyInstance) {
  // List all habits
  app.get("/api/v1/health/habits", async (request, reply) => {
    try {
      const { includeInactive } = request.query as { includeInactive?: string };
      const condition = includeInactive === "true" ? undefined : eq(habits.isActive, true);
      const result = await db.select().from(habits).where(condition);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch habits" });
    }
  });

  // Create habit
  app.post("/api/v1/health/habits", async (request, reply) => {
    try {
      const body = request.body as {
        name: string;
        description?: string;
        frequency?: string;
        targetValue?: number;
        unit?: string;
        icon?: string;
        color?: string;
      };

      if (!body.name) return reply.status(400).send({ error: "name is required" });

      const [habit] = await db
        .insert(habits)
        .values({
          name: body.name,
          description: body.description || null,
          frequency: body.frequency || "daily",
          targetValue: body.targetValue ? String(body.targetValue) : null,
          unit: body.unit || null,
          icon: body.icon || null,
          color: body.color || null,
        })
        .returning();

      return reply.status(201).send(habit);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create habit" });
    }
  });

  // Update habit
  app.put<{ Params: { id: string } }>("/api/v1/health/habits/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body as Partial<{
        name: string;
        description: string;
        frequency: string;
        targetValue: number;
        unit: string;
        icon: string;
        color: string;
        isActive: boolean;
      }>;

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.frequency !== undefined) updateData.frequency = body.frequency;
      if (body.targetValue !== undefined) updateData.targetValue = String(body.targetValue);
      if (body.unit !== undefined) updateData.unit = body.unit;
      if (body.icon !== undefined) updateData.icon = body.icon;
      if (body.color !== undefined) updateData.color = body.color;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;

      const [updated] = await db
        .update(habits)
        .set(updateData)
        .where(eq(habits.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: "Habit not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update habit" });
    }
  });

  // Delete habit (soft)
  app.delete<{ Params: { id: string } }>("/api/v1/health/habits/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [updated] = await db
        .update(habits)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(habits.id, id))
        .returning();

      if (!updated) return reply.status(404).send({ error: "Habit not found" });
      return reply.send({ message: "Habit deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete habit" });
    }
  });

  // ─── Completions ────────────────────────────────────────

  // Get completions for a habit
  app.get<{ Params: { id: string } }>("/api/v1/health/habits/:id/completions", async (request, reply) => {
    try {
      const { id } = request.params;
      const { from } = request.query as { from?: string };

      const conditions = [eq(habitCompletions.habitId, id)];
      if (from) conditions.push(gte(habitCompletions.completedAt, from));

      const result = await db
        .select()
        .from(habitCompletions)
        .where(and(...conditions))
        .orderBy(desc(habitCompletions.completedAt));

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch completions" });
    }
  });

  // Complete a habit for a date
  app.post<{ Params: { id: string } }>("/api/v1/health/habits/:id/complete", async (request, reply) => {
    try {
      const { id } = request.params;
      const body = request.body as {
        date?: string;
        value?: number;
        notes?: string;
      };

      const [completion] = await db
        .insert(habitCompletions)
        .values({
          habitId: id,
          completedAt: body.date || new Date().toISOString().slice(0, 10),
          value: body.value ? String(body.value) : null,
          notes: body.notes || null,
        })
        .returning();

      return reply.status(201).send(completion);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to complete habit" });
    }
  });
}
