import { FastifyInstance } from "fastify";
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createContributionSchema,
} from "@vdp/shared";
import { walletService } from "../service.js";

export async function savingsRoutes(app: FastifyInstance) {
  app.get("/api/v1/savings", async (_request, reply) => {
    try {
      const result = await walletService.listSavingsGoals();
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch savings goals" });
    }
  });

  app.get<{ Params: { id: string } }>("/api/v1/savings/:id", async (request, reply) => {
    try {
      const result = await walletService.getSavingsGoalWithContributions(request.params.id);
      if (!result) return reply.status(404).send({ error: "Savings goal not found" });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch savings goal" });
    }
  });

  app.post("/api/v1/savings", async (request, reply) => {
    try {
      const parsed = createSavingsGoalSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const goal = await walletService.createSavingsGoal(parsed.data);
      return reply.status(201).send(goal);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create savings goal" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/savings/:id", async (request, reply) => {
    try {
      const parsed = updateSavingsGoalSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await walletService.updateSavingsGoal(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Savings goal not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update savings goal" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/savings/:id", async (request, reply) => {
    try {
      const deleted = await walletService.deleteSavingsGoal(request.params.id);
      if (!deleted) return reply.status(404).send({ error: "Savings goal not found" });
      return reply.send({ message: "Savings goal deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete savings goal" });
    }
  });

  app.post<{ Params: { id: string } }>("/api/v1/savings/:id/contribute", async (request, reply) => {
    try {
      // Verify goal exists first
      const goal = await walletService.getSavingsGoalWithContributions(request.params.id);
      if (!goal) return reply.status(404).send({ error: "Savings goal not found" });

      const parsed = createContributionSchema.safeParse({
        ...(request.body as object),
        goalId: request.params.id,
      });
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

      const result = await walletService.contributeToSavings(request.params.id, parsed.data);
      return reply.status(201).send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to add contribution" });
    }
  });
}
