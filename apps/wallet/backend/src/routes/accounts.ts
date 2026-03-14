import { FastifyInstance } from "fastify";
import { db } from "@vdp/db";
import { accounts, transactions } from "@vdp/db";
import { createAccountSchema, updateAccountSchema } from "@vdp/shared";
import { eq, sql } from "drizzle-orm";

export async function accountsRoutes(app: FastifyInstance) {
  // List all active accounts with computed current_balance
  app.get("/api/v1/accounts", async (_request, reply) => {
    try {
      const balanceSubquery = sql`
        COALESCE((
          SELECT
            SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) -
            SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END)
          FROM ${transactions}
          WHERE ${transactions.accountId} = ${accounts.id}
        ), 0)
      `;

      const result = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          currency: accounts.currency,
          type: accounts.type,
          initialBalance: accounts.initialBalance,
          isActive: accounts.isActive,
          createdAt: accounts.createdAt,
          updatedAt: accounts.updatedAt,
          currentBalance: sql<string>`(${accounts.initialBalance}::numeric + ${balanceSubquery})::text`.as("current_balance"),
        })
        .from(accounts)
        .where(eq(accounts.isActive, true));

      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch accounts" });
    }
  });

  // Get single account
  app.get<{ Params: { id: string } }>("/api/v1/accounts/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const balanceSubquery = sql`
        COALESCE((
          SELECT
            SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) -
            SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END)
          FROM ${transactions}
          WHERE ${transactions.accountId} = ${accounts.id}
        ), 0)
      `;

      const result = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          currency: accounts.currency,
          type: accounts.type,
          initialBalance: accounts.initialBalance,
          isActive: accounts.isActive,
          createdAt: accounts.createdAt,
          updatedAt: accounts.updatedAt,
          currentBalance: sql<string>`(${accounts.initialBalance}::numeric + ${balanceSubquery})::text`.as("current_balance"),
        })
        .from(accounts)
        .where(eq(accounts.id, id));

      if (result.length === 0) {
        return reply.status(404).send({ error: "Account not found" });
      }

      return reply.send(result[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch account" });
    }
  });

  // Create account
  app.post("/api/v1/accounts", async (request, reply) => {
    try {
      const parsed = createAccountSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [account] = await db.insert(accounts).values(parsed.data).returning();
      return reply.status(201).send(account);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create account" });
    }
  });

  // Update account
  app.put<{ Params: { id: string } }>("/api/v1/accounts/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const parsed = updateAccountSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [updated] = await db
        .update(accounts)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(accounts.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Account not found" });
      }

      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update account" });
    }
  });

  // Soft delete account
  app.delete<{ Params: { id: string } }>("/api/v1/accounts/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const [updated] = await db
        .update(accounts)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(accounts.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Account not found" });
      }

      return reply.send({ message: "Account deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete account" });
    }
  });
}
