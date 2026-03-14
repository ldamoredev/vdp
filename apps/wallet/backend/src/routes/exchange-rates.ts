import { FastifyInstance } from "fastify";
import { db } from "@vdp/db";
import { exchangeRates } from "@vdp/db";
import { createExchangeRateSchema } from "@vdp/shared";
import { desc, sql } from "drizzle-orm";

export async function exchangeRatesRoutes(app: FastifyInstance) {
  // Get latest exchange rates
  app.get("/api/v1/exchange-rates/latest", async (_request, reply) => {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT ON (from_currency, to_currency, type)
          id, from_currency, to_currency, rate, type, date, created_at
        FROM wallet.exchange_rates
        ORDER BY from_currency, to_currency, type, date DESC
      `);

      return reply.send(result.rows);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch exchange rates" });
    }
  });

  // Create or update exchange rate
  app.post("/api/v1/exchange-rates", async (request, reply) => {
    try {
      const parsed = createExchangeRateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const [rate] = await db
        .insert(exchangeRates)
        .values(parsed.data)
        .onConflictDoUpdate({
          target: [
            exchangeRates.fromCurrency,
            exchangeRates.toCurrency,
            exchangeRates.type,
            exchangeRates.date,
          ],
          set: {
            rate: parsed.data.rate,
            createdAt: new Date(),
          },
        })
        .returning();

      return reply.status(201).send(rate);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create/update exchange rate" });
    }
  });
}
