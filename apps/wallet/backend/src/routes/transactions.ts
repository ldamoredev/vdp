import { FastifyInstance } from "fastify";
import { db } from "@vdp/db";
import { transactions } from "@vdp/db";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
} from "@vdp/shared";
import { eq, and, gte, lte, desc, like, sql, SQL } from "drizzle-orm";

export async function transactionsRoutes(app: FastifyInstance) {
  // List transactions with filters and pagination
  app.get("/api/v1/transactions", async (request, reply) => {
    try {
      const parsed = transactionFiltersSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { accountId, categoryId, type, from, to, search, limit, offset } = parsed.data;
      const conditions: SQL[] = [];

      if (accountId) conditions.push(eq(transactions.accountId, accountId));
      if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));
      if (type) conditions.push(eq(transactions.type, type));
      if (from) conditions.push(gte(transactions.date, from));
      if (to) conditions.push(lte(transactions.date, to));
      if (search) conditions.push(like(transactions.description, `%${search}%`));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [data, countResult] = await Promise.all([
        db
          .select()
          .from(transactions)
          .where(whereClause)
          .orderBy(desc(transactions.date))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(transactions)
          .where(whereClause),
      ]);

      return reply.send({
        data,
        total: countResult[0].count,
        limit,
        offset,
      });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch transactions" });
    }
  });

  // Get single transaction
  app.get<{ Params: { id: string } }>("/api/v1/transactions/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await db.select().from(transactions).where(eq(transactions.id, id));

      if (result.length === 0) {
        return reply.status(404).send({ error: "Transaction not found" });
      }

      return reply.send(result[0]);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch transaction" });
    }
  });

  // Create transaction
  app.post("/api/v1/transactions", async (request, reply) => {
    try {
      const parsed = createTransactionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [transaction] = await db.insert(transactions).values(parsed.data).returning();
      return reply.status(201).send(transaction);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create transaction" });
    }
  });

  // Update transaction
  app.put<{ Params: { id: string } }>("/api/v1/transactions/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const parsed = updateTransactionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [updated] = await db
        .update(transactions)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(transactions.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Transaction not found" });
      }

      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update transaction" });
    }
  });

  // Delete transaction
  app.delete<{ Params: { id: string } }>("/api/v1/transactions/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const [deleted] = await db.delete(transactions).where(eq(transactions.id, id)).returning();

      if (!deleted) {
        return reply.status(404).send({ error: "Transaction not found" });
      }

      return reply.send({ message: "Transaction deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete transaction" });
    }
  });
}
