import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { savingsGoals, savingsContributions } from "../schema.js";
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createContributionSchema,
} from "@vdp/shared";
import { eq, sql } from "drizzle-orm";

export async function savingsRoutes(app: FastifyInstance) {
  app.get("/api/v1/savings", async (_request, reply) => {
    try {
      const result = await db.select().from(savingsGoals);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch savings goals" });
    }
  });

  app.get<{ Params: { id: string } }>("/api/v1/savings/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const goalResult = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
      if (goalResult.length === 0) {
        return reply.status(404).send({ error: "Savings goal not found" });
      }
      const contributions = await db
        .select()
        .from(savingsContributions)
        .where(eq(savingsContributions.goalId, id));
      return reply.send({ ...goalResult[0], contributions });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch savings goal" });
    }
  });

  app.post("/api/v1/savings", async (request, reply) => {
    try {
      const parsed = createSavingsGoalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const [goal] = await db.insert(savingsGoals).values(parsed.data).returning();
      return reply.status(201).send(goal);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create savings goal" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/savings/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const parsed = updateSavingsGoalSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }
      const [updated] = await db
        .update(savingsGoals)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(savingsGoals.id, id))
        .returning();
      if (!updated) {
        return reply.status(404).send({ error: "Savings goal not found" });
      }
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update savings goal" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/savings/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [deleted] = await db.delete(savingsGoals).where(eq(savingsGoals.id, id)).returning();
      if (!deleted) {
        return reply.status(404).send({ error: "Savings goal not found" });
      }
      return reply.send({ message: "Savings goal deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete savings goal" });
    }
  });

  app.post<{ Params: { id: string } }>("/api/v1/savings/:id/contribute", async (request, reply) => {
    try {
      const { id } = request.params;
      const goalResult = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
      if (goalResult.length === 0) {
        return reply.status(404).send({ error: "Savings goal not found" });
      }

      const parsed = createContributionSchema.safeParse({
        ...(request.body as object),
        goalId: id,
      });
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [contribution] = await db.insert(savingsContributions).values(parsed.data).returning();

      const [updatedGoal] = await db
        .update(savingsGoals)
        .set({
          currentAmount: sql`(${savingsGoals.currentAmount}::numeric + ${parsed.data.amount}::numeric)::text`,
          updatedAt: new Date(),
        })
        .where(eq(savingsGoals.id, id))
        .returning();

      return reply.status(201).send({ contribution, goal: updatedGoal });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to add contribution" });
    }
  });
}
