import type Anthropic from "@anthropic-ai/sdk";
import { db } from "@vdp/db";
import {
  accounts,
  categories,
  transactions,
  savingsGoals,
  savingsContributions,
  investments,
  exchangeRates,
} from "@vdp/db";
import { eq, and, gte, lte, desc, sql, like } from "drizzle-orm";

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "list_transactions",
    description:
      "Search and list transactions. Can filter by account, category, type, date range, and search text.",
    input_schema: {
      type: "object" as const,
      properties: {
        accountId: { type: "string", description: "Filter by account ID" },
        categoryId: { type: "string", description: "Filter by category ID" },
        type: {
          type: "string",
          enum: ["income", "expense", "transfer"],
          description: "Filter by transaction type",
        },
        from: {
          type: "string",
          description: "Start date (YYYY-MM-DD)",
        },
        to: {
          type: "string",
          description: "End date (YYYY-MM-DD)",
        },
        search: {
          type: "string",
          description: "Search in description",
        },
        limit: {
          type: "number",
          description: "Max results (default 10)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_transaction",
    description:
      "Create a new transaction (income, expense, or transfer). Returns the created transaction.",
    input_schema: {
      type: "object" as const,
      properties: {
        accountId: {
          type: "string",
          description: "Account ID. If not provided, will use first account matching currency.",
        },
        categoryId: {
          type: "string",
          description: "Category ID (optional for transfers)",
        },
        type: {
          type: "string",
          enum: ["income", "expense", "transfer"],
        },
        amount: {
          type: "string",
          description: "Amount as string (e.g., '5000.00')",
        },
        currency: {
          type: "string",
          enum: ["ARS", "USD"],
          description: "Currency code. Defaults to ARS.",
        },
        description: {
          type: "string",
          description: "Transaction description",
        },
        date: {
          type: "string",
          description: "Date (YYYY-MM-DD). Defaults to today.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for the transaction",
        },
      },
      required: ["type", "amount"],
    },
  },
  {
    name: "get_accounts_with_balances",
    description: "Get all accounts with their current balances.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_categories",
    description: "List available transaction categories.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["income", "expense"],
          description: "Filter by category type",
        },
      },
      required: [],
    },
  },
  {
    name: "get_spending_by_category",
    description:
      "Get spending breakdown by category for a date range.",
    input_schema: {
      type: "object" as const,
      properties: {
        from: { type: "string", description: "Start date (YYYY-MM-DD)" },
        to: { type: "string", description: "End date (YYYY-MM-DD)" },
        currency: { type: "string", enum: ["ARS", "USD"] },
      },
      required: [],
    },
  },
  {
    name: "get_monthly_summary",
    description:
      "Get income, expenses, and net for a given month/year.",
    input_schema: {
      type: "object" as const,
      properties: {
        month: { type: "number", description: "Month (1-12)" },
        year: { type: "number", description: "Year (e.g., 2026)" },
      },
      required: [],
    },
  },
  {
    name: "get_savings_goals",
    description: "List savings goals with their progress.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "contribute_to_savings",
    description: "Add a contribution to a savings goal.",
    input_schema: {
      type: "object" as const,
      properties: {
        goalId: { type: "string", description: "Savings goal ID" },
        amount: { type: "string", description: "Amount to contribute" },
        date: { type: "string", description: "Date (YYYY-MM-DD)" },
        note: { type: "string", description: "Optional note" },
      },
      required: ["goalId", "amount"],
    },
  },
  {
    name: "get_investments_summary",
    description: "Get investment portfolio overview.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "update_exchange_rate",
    description: "Set the current exchange rate between currencies.",
    input_schema: {
      type: "object" as const,
      properties: {
        fromCurrency: { type: "string", enum: ["ARS", "USD"] },
        toCurrency: { type: "string", enum: ["ARS", "USD"] },
        rate: { type: "string", description: "Exchange rate" },
        type: {
          type: "string",
          enum: ["official", "blue", "mep", "ccl"],
          description: "Rate type",
        },
      },
      required: ["fromCurrency", "toCurrency", "rate", "type"],
    },
  },
];

export async function executeTool(
  name: string,
  input: Record<string, any>
): Promise<string> {
  switch (name) {
    case "list_transactions": {
      const conditions = [];
      if (input.accountId)
        conditions.push(eq(transactions.accountId, input.accountId));
      if (input.categoryId)
        conditions.push(eq(transactions.categoryId, input.categoryId));
      if (input.type) conditions.push(eq(transactions.type, input.type));
      if (input.from) conditions.push(gte(transactions.date, input.from));
      if (input.to) conditions.push(lte(transactions.date, input.to));
      if (input.search)
        conditions.push(like(transactions.description, `%${input.search}%`));

      const result = await db
        .select()
        .from(transactions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(transactions.date))
        .limit(input.limit || 10);
      return JSON.stringify(result);
    }

    case "create_transaction": {
      const currency = input.currency || "ARS";
      let accountId = input.accountId;

      if (!accountId) {
        const accs = await db
          .select()
          .from(accounts)
          .where(
            and(eq(accounts.currency, currency), eq(accounts.isActive, true))
          )
          .limit(1);
        if (accs.length > 0) accountId = accs[0].id;
        else throw new Error(`No active account found for currency ${currency}`);
      }

      const [tx] = await db
        .insert(transactions)
        .values({
          accountId,
          categoryId: input.categoryId || null,
          type: input.type,
          amount: input.amount,
          currency,
          description: input.description || null,
          date: input.date || new Date().toISOString().slice(0, 10),
          tags: input.tags || [],
        })
        .returning();
      return JSON.stringify(tx);
    }

    case "get_accounts_with_balances": {
      const balanceSub = sql`
        COALESCE((
          SELECT
            SUM(CASE WHEN t.type = 'income' THEN t.amount::numeric ELSE 0 END) -
            SUM(CASE WHEN t.type = 'expense' THEN t.amount::numeric ELSE 0 END)
          FROM wallet.transactions t
          WHERE t.account_id = wallet.accounts.id
        ), 0)
      `;
      const result = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          currency: accounts.currency,
          type: accounts.type,
          initialBalance: accounts.initialBalance,
          currentBalance: sql<string>`(${accounts.initialBalance}::numeric + ${balanceSub})::text`,
        })
        .from(accounts)
        .where(eq(accounts.isActive, true));
      return JSON.stringify(result);
    }

    case "list_categories": {
      const result = input.type
        ? await db
            .select()
            .from(categories)
            .where(eq(categories.type, input.type))
        : await db.select().from(categories);
      return JSON.stringify(result);
    }

    case "get_spending_by_category": {
      const result = await db.execute(sql`
        SELECT
          c.name AS category,
          c.icon,
          SUM(t.amount::numeric)::text AS total,
          COUNT(t.id)::int AS count
        FROM wallet.transactions t
        LEFT JOIN wallet.categories c ON c.id = t.category_id
        WHERE t.type = 'expense'
          ${input.from ? sql`AND t.date >= ${input.from}` : sql``}
          ${input.to ? sql`AND t.date <= ${input.to}` : sql``}
          ${input.currency ? sql`AND t.currency = ${input.currency}` : sql``}
        GROUP BY c.name, c.icon
        ORDER BY SUM(t.amount::numeric) DESC
      `);
      return JSON.stringify(result.rows);
    }

    case "get_monthly_summary": {
      const now = new Date();
      const month = input.month || now.getMonth() + 1;
      const year = input.year || now.getFullYear();
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endMonth = month === 12 ? 1 : month + 1;
      const endYear = month === 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      const result = await db
        .select({
          currency: transactions.currency,
          totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
          totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
          net: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) - SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
        })
        .from(transactions)
        .where(
          and(
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        )
        .groupBy(transactions.currency);
      return JSON.stringify({ month, year, data: result });
    }

    case "get_savings_goals": {
      const result = await db.select().from(savingsGoals);
      return JSON.stringify(result);
    }

    case "contribute_to_savings": {
      const date = input.date || new Date().toISOString().slice(0, 10);
      const [contribution] = await db
        .insert(savingsContributions)
        .values({
          goalId: input.goalId,
          amount: input.amount,
          date,
          note: input.note || null,
        })
        .returning();

      // Update goal current amount
      await db.execute(sql`
        UPDATE wallet.savings_goals
        SET current_amount = (
          SELECT COALESCE(SUM(amount::numeric), 0)
          FROM wallet.savings_contributions
          WHERE goal_id = ${input.goalId}
        )::text,
        updated_at = NOW()
        WHERE id = ${input.goalId}
      `);

      return JSON.stringify(contribution);
    }

    case "get_investments_summary": {
      const result = await db
        .select()
        .from(investments)
        .where(eq(investments.isActive, true));
      return JSON.stringify(result);
    }

    case "update_exchange_rate": {
      const date = new Date().toISOString().slice(0, 10);
      const [rate] = await db
        .insert(exchangeRates)
        .values({
          fromCurrency: input.fromCurrency,
          toCurrency: input.toCurrency,
          rate: input.rate,
          type: input.type,
          date,
        })
        .onConflictDoNothing()
        .returning();
      return JSON.stringify(rate || { message: "Rate already exists for today" });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
