import { FastifyInstance } from "fastify";
import { createAccountSchema, updateAccountSchema } from "@vdp/shared";
import { walletService } from "../service.js";

export async function accountsRoutes(app: FastifyInstance) {
  app.get("/api/v1/accounts", async (_request, reply) => {
    try {
      const result = await walletService.getAccountsWithBalances();
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch accounts" });
    }
  });

  app.get<{ Params: { id: string } }>("/api/v1/accounts/:id", async (request, reply) => {
    try {
      const result = await walletService.getAccountById(request.params.id);
      if (!result) return reply.status(404).send({ error: "Account not found" });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch account" });
    }
  });

  app.post("/api/v1/accounts", async (request, reply) => {
    try {
      const parsed = createAccountSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const account = await walletService.createAccount(parsed.data);
      return reply.status(201).send(account);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create account" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/accounts/:id", async (request, reply) => {
    try {
      const parsed = updateAccountSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await walletService.updateAccount(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Account not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update account" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/accounts/:id", async (request, reply) => {
    try {
      const updated = await walletService.deactivateAccount(request.params.id);
      if (!updated) return reply.status(404).send({ error: "Account not found" });
      return reply.send({ message: "Account deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete account" });
    }
  });
}
