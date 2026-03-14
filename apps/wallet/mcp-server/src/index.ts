#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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

const server = new McpServer({
  name: "vdp-wallet",
  version: "0.0.1",
});

// List transactions
server.tool(
  "list_transactions",
  "Search and list wallet transactions with optional filters",
  {
    accountId: z.string().optional().describe("Filter by account ID"),
    categoryId: z.string().optional().describe("Filter by category ID"),
    type: z.enum(["income", "expense", "transfer"]).optional(),
    from: z.string().optional().describe("Start date YYYY-MM-DD"),
    to: z.string().optional().describe("End date YYYY-MM-DD"),
    search: z.string().optional().describe("Search in description"),
    limit: z.number().optional().default(10),
  },
  async (input) => {
    const conditions = [];
    if (input.accountId) conditions.push(eq(transactions.accountId, input.accountId));
    if (input.categoryId) conditions.push(eq(transactions.categoryId, input.categoryId));
    if (input.type) conditions.push(eq(transactions.type, input.type));
    if (input.from) conditions.push(gte(transactions.date, input.from));
    if (input.to) conditions.push(lte(transactions.date, input.to));
    if (input.search) conditions.push(like(transactions.description, `%${input.search}%`));

    const result = await db
      .select()
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactions.date))
      .limit(input.limit);

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Create transaction
server.tool(
  "create_transaction",
  "Create a new wallet transaction",
  {
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.string().describe("Amount as string"),
    currency: z.enum(["ARS", "USD"]).optional().default("ARS"),
    accountId: z.string().optional().describe("Account ID (auto-selects if omitted)"),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional().describe("YYYY-MM-DD, defaults to today"),
    tags: z.array(z.string()).optional().default([]),
  },
  async (input) => {
    let accountId = input.accountId;
    if (!accountId) {
      const accs = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.currency, input.currency), eq(accounts.isActive, true)))
        .limit(1);
      if (accs.length === 0) throw new Error(`No account for ${input.currency}`);
      accountId = accs[0].id;
    }

    const [tx] = await db
      .insert(transactions)
      .values({
        accountId,
        categoryId: input.categoryId || null,
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        description: input.description || null,
        date: input.date || new Date().toISOString().slice(0, 10),
        tags: input.tags,
      })
      .returning();

    return { content: [{ type: "text", text: JSON.stringify(tx, null, 2) }] };
  }
);

// Get accounts with balances
server.tool(
  "get_accounts_with_balances",
  "Get all wallet accounts with current balances",
  {},
  async () => {
    const result = await db.execute(sql`
      SELECT
        a.id, a.name, a.currency, a.type,
        (a.initial_balance::numeric + COALESCE((
          SELECT SUM(CASE WHEN t.type = 'income' THEN t.amount::numeric ELSE 0 END) -
                 SUM(CASE WHEN t.type = 'expense' THEN t.amount::numeric ELSE 0 END)
          FROM wallet.transactions t WHERE t.account_id = a.id
        ), 0))::text AS current_balance
      FROM wallet.accounts a WHERE a.is_active = true
    `);
    return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
  }
);

// List categories
server.tool(
  "list_categories",
  "List wallet transaction categories",
  {
    type: z.enum(["income", "expense"]).optional(),
  },
  async (input) => {
    const result = input.type
      ? await db.select().from(categories).where(eq(categories.type, input.type))
      : await db.select().from(categories);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Get monthly summary
server.tool(
  "get_monthly_summary",
  "Get income, expenses, and net for a month",
  {
    month: z.number().optional(),
    year: z.number().optional(),
  },
  async (input) => {
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
      })
      .from(transactions)
      .where(and(gte(transactions.date, startDate), lte(transactions.date, endDate)))
      .groupBy(transactions.currency);

    return { content: [{ type: "text", text: JSON.stringify({ month, year, data: result }, null, 2) }] };
  }
);

// Get spending by category
server.tool(
  "get_spending_by_category",
  "Get spending breakdown by category",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    currency: z.enum(["ARS", "USD"]).optional(),
  },
  async (input) => {
    const result = await db.execute(sql`
      SELECT c.name AS category, c.icon, SUM(t.amount::numeric)::text AS total, COUNT(t.id)::int AS count
      FROM wallet.transactions t
      LEFT JOIN wallet.categories c ON c.id = t.category_id
      WHERE t.type = 'expense'
        ${input.from ? sql`AND t.date >= ${input.from}` : sql``}
        ${input.to ? sql`AND t.date <= ${input.to}` : sql``}
        ${input.currency ? sql`AND t.currency = ${input.currency}` : sql``}
      GROUP BY c.name, c.icon ORDER BY SUM(t.amount::numeric) DESC
    `);
    return { content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }] };
  }
);

// Get savings goals
server.tool(
  "get_savings_goals",
  "List savings goals with progress",
  {},
  async () => {
    const result = await db.select().from(savingsGoals);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Get investments
server.tool(
  "get_investments_summary",
  "Get investment portfolio overview",
  {},
  async () => {
    const result = await db.select().from(investments).where(eq(investments.isActive, true));
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
