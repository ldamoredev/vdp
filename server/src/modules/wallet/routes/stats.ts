import { FastifyInstance } from "fastify";
import { db } from "../../../core/db/client.js";
import { transactions } from "../schema.js";
import { statsQuerySchema } from "@vdp/shared";
import { and, gte, lte, sql, SQL, eq } from "drizzle-orm";

export async function statsRoutes(app: FastifyInstance) {
  app.get("/api/v1/stats/summary", async (request, reply) => {
    try {
      const parsed = statsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { month, year } = parsed.data;

      const balances = await db.execute(sql`
        SELECT
          a.currency,
          SUM(
            a.initial_balance::numeric +
            COALESCE((
              SELECT
                SUM(CASE WHEN t.type = 'income' THEN t.amount::numeric ELSE 0 END) -
                SUM(CASE WHEN t.type = 'expense' THEN t.amount::numeric ELSE 0 END)
              FROM wallet.transactions t
              WHERE t.account_id = a.id
            ), 0)
          )::text AS total_balance
        FROM wallet.accounts a
        WHERE a.is_active = true
        GROUP BY a.currency
      `);

      const conditions: SQL[] = [];
      if (year) {
        if (month) {
          const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
          const endMonth = month === 12 ? 1 : month + 1;
          const endYear = month === 12 ? year + 1 : year;
          const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
          conditions.push(gte(transactions.date, startDate));
          conditions.push(lte(transactions.date, endDate));
        } else {
          conditions.push(gte(transactions.date, `${year}-01-01`));
          conditions.push(lte(transactions.date, `${year}-12-31`));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const incomeExpense = await db
        .select({
          currency: transactions.currency,
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
          net: sql<string>`COALESCE(
            SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) -
            SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END),
          0)::text`,
        })
        .from(transactions)
        .where(whereClause)
        .groupBy(transactions.currency);

      return reply.send({ balances: balances.rows, incomeExpense });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch summary stats" });
    }
  });

  app.get("/api/v1/stats/by-category", async (request, reply) => {
    try {
      const parsed = statsQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() });
      }

      const { from, to, currency } = parsed.data;

      const result = await db.execute(sql`
        SELECT
          c.id AS category_id,
          c.name AS category_name,
          c.icon AS category_icon,
          SUM(t.amount::numeric)::text AS total,
          COUNT(t.id)::int AS transaction_count
        FROM wallet.transactions t
        LEFT JOIN wallet.categories c ON c.id = t.category_id
        WHERE t.type = 'expense'
          ${from ? sql`AND t.date >= ${from}` : sql``}
          ${to ? sql`AND t.date <= ${to}` : sql``}
          ${currency ? sql`AND t.currency = ${currency}` : sql``}
        GROUP BY c.id, c.name, c.icon
        ORDER BY SUM(t.amount::numeric) DESC
      `);

      return reply.send(result.rows);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch category stats" });
    }
  });

  app.get("/api/v1/stats/monthly-trend", async (request, reply) => {
    try {
      const result = await db.execute(sql`
        SELECT
          TO_CHAR(t.date::date, 'YYYY-MM') AS month,
          t.currency,
          COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount::numeric ELSE 0 END), 0)::text AS income,
          COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount::numeric ELSE 0 END), 0)::text AS expense,
          COALESCE(
            SUM(CASE WHEN t.type = 'income' THEN t.amount::numeric ELSE 0 END) -
            SUM(CASE WHEN t.type = 'expense' THEN t.amount::numeric ELSE 0 END),
          0)::text AS net
        FROM wallet.transactions t
        WHERE t.date >= (CURRENT_DATE - INTERVAL '12 months')::date::text
        GROUP BY TO_CHAR(t.date::date, 'YYYY-MM'), t.currency
        ORDER BY month ASC
      `);

      return reply.send(result.rows);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch monthly trend" });
    }
  });
}
