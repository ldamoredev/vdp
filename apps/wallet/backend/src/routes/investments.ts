import { FastifyInstance } from "fastify";
import { db } from "@vdp/db";
import { investments } from "@vdp/db";
import { createInvestmentSchema, updateInvestmentSchema } from "@vdp/shared";
import { eq } from "drizzle-orm";

export async function investmentsRoutes(app: FastifyInstance) {
  // List all active investments
  app.get("/api/v1/investments", async (_request, reply) => {
    try {
      const result = await db
        .select()
        .from(investments)
        .where(eq(investments.isActive, true));

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch investments" });
    }
  });

  // Get single investment
  app.get<{ Params: { id: string } }>("/api/v1/investments/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await db.select().from(investments).where(eq(investments.id, id));

      if (result.length === 0) {
        return reply.status(404).send({ error: "Investment not found" });
      }

      return reply.send(result[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch investment" });
    }
  });

  // Create investment
  app.post("/api/v1/investments", async (request, reply) => {
    try {
      const parsed = createInvestmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [investment] = await db.insert(investments).values(parsed.data).returning();
      return reply.status(201).send(investment);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create investment" });
    }
  });

  // Update investment
  app.put<{ Params: { id: string } }>("/api/v1/investments/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const parsed = updateInvestmentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [updated] = await db
        .update(investments)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(investments.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Investment not found" });
      }

      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update investment" });
    }
  });

  // Delete investment (soft delete)
  app.delete<{ Params: { id: string } }>("/api/v1/investments/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const [updated] = await db
        .update(investments)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(investments.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Investment not found" });
      }

      return reply.send({ message: "Investment deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete investment" });
    }
  });
}
