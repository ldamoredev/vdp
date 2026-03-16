import { FastifyInstance } from "fastify";
import { createInvestmentSchema, updateInvestmentSchema } from "@vdp/shared";
import { walletService } from "../service.js";

export async function investmentsRoutes(app: FastifyInstance) {
  app.get("/api/v1/investments", async (_request, reply) => {
    try {
      const result = await walletService.listInvestments();
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch investments" });
    }
  });

  app.get<{ Params: { id: string } }>("/api/v1/investments/:id", async (request, reply) => {
    try {
      const result = await walletService.getInvestment(request.params.id);
      if (!result) return reply.status(404).send({ error: "Investment not found" });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch investment" });
    }
  });

  app.post("/api/v1/investments", async (request, reply) => {
    try {
      const parsed = createInvestmentSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const investment = await walletService.createInvestment(parsed.data);
      return reply.status(201).send(investment);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create investment" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/investments/:id", async (request, reply) => {
    try {
      const parsed = updateInvestmentSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await walletService.updateInvestment(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Investment not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update investment" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/investments/:id", async (request, reply) => {
    try {
      const updated = await walletService.deactivateInvestment(request.params.id);
      if (!updated) return reply.status(404).send({ error: "Investment not found" });
      return reply.send({ message: "Investment deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete investment" });
    }
  });
}
