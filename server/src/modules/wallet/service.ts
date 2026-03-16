import { db } from "../../core/db/client.js";
import {
  accounts,
  categories,
  transactions,
  savingsGoals,
  savingsContributions,
  investments,
  exchangeRates,
} from "./schema.js";
import { walletEvents } from "./events.js";
import { eq, and, gte, lte, desc, like, sql, type SQL } from "drizzle-orm";

// ─── Balance subquery (reused across methods) ────────────
const balanceSubquery = sql`
  COALESCE((
    SELECT
      SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) -
      SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END)
    FROM ${transactions}
    WHERE ${transactions.accountId} = ${accounts.id}
  ), 0)
`;

class WalletService {
  // ─── Accounts ────────────────────────────────────────────

  async getAccountsWithBalances() {
    return db
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
  }

  async getAccountById(id: string) {
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
    return result[0] ?? null;
  }

  async createAccount(data: {
    name: string;
    currency: string;
    type: string;
    initialBalance?: string;
  }) {
    const [account] = await db.insert(accounts).values(data).returning();
    return account;
  }

  async updateAccount(id: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updated ?? null;
  }

  async deactivateAccount(id: string) {
    const [updated] = await db
      .update(accounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updated ?? null;
  }

  // ─── Transactions ────────────────────────────────────────

  async listTransactions(filters: {
    accountId?: string;
    categoryId?: string;
    type?: string;
    from?: string;
    to?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: SQL[] = [];
    if (filters.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
    if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
    if (filters.type) conditions.push(eq(transactions.type, filters.type));
    if (filters.from) conditions.push(gte(transactions.date, filters.from));
    if (filters.to) conditions.push(lte(transactions.date, filters.to));
    if (filters.search) conditions.push(like(transactions.description, `%${filters.search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

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

    return { data, total: countResult[0].count, limit, offset };
  }

  async getTransaction(id: string) {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0] ?? null;
  }

  async createTransaction(data: {
    accountId?: string;
    categoryId?: string | null;
    type: string;
    amount: string;
    currency?: string;
    description?: string | null;
    date?: string;
    tags?: string[];
    transferToAccountId?: string | null;
  }) {
    const currency = data.currency || "ARS";
    let accountId = data.accountId;

    if (!accountId) {
      accountId = await this.resolveDefaultAccount(currency);
    }

    const [tx] = await db
      .insert(transactions)
      .values({
        accountId,
        categoryId: data.categoryId || null,
        type: data.type,
        amount: data.amount,
        currency,
        description: data.description || null,
        date: data.date || new Date().toISOString().slice(0, 10),
        tags: data.tags || [],
        transferToAccountId: data.transferToAccountId || null,
      })
      .returning();

    // Service emits events — callers don't need to remember
    await walletEvents.transactionCreated({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      categoryId: tx.categoryId,
      description: tx.description,
    });

    return tx;
  }

  async updateTransaction(id: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(transactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteTransaction(id: string) {
    const [deleted] = await db.delete(transactions).where(eq(transactions.id, id)).returning();
    return deleted ?? null;
  }

  // ─── Categories ──────────────────────────────────────────

  async listCategories(type?: string) {
    if (type && (type === "income" || type === "expense")) {
      return db.select().from(categories).where(eq(categories.type, type));
    }
    return db.select().from(categories);
  }

  async getCategory(id: string) {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0] ?? null;
  }

  async createCategory(data: {
    name: string;
    type: string;
    icon?: string | null;
    parentId?: string | null;
  }) {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  async updateCategory(id: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteCategory(id: string) {
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    return deleted ?? null;
  }

  // ─── Savings ─────────────────────────────────────────────

  async listSavingsGoals() {
    return db.select().from(savingsGoals);
  }

  async getSavingsGoalWithContributions(id: string) {
    const goalResult = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
    if (goalResult.length === 0) return null;
    const contributions = await db
      .select()
      .from(savingsContributions)
      .where(eq(savingsContributions.goalId, id));
    return { ...goalResult[0], contributions };
  }

  async createSavingsGoal(data: {
    name: string;
    targetAmount: string;
    currency: string;
    deadline?: string | null;
  }) {
    const [goal] = await db.insert(savingsGoals).values(data).returning();
    return goal;
  }

  async updateSavingsGoal(id: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(savingsGoals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savingsGoals.id, id))
      .returning();
    return updated ?? null;
  }

  async deleteSavingsGoal(id: string) {
    const [deleted] = await db.delete(savingsGoals).where(eq(savingsGoals.id, id)).returning();
    return deleted ?? null;
  }

  async contributeToSavings(goalId: string, data: {
    amount: string;
    date?: string;
    note?: string | null;
    transactionId?: string | null;
  }) {
    const date = data.date || new Date().toISOString().slice(0, 10);

    const [contribution] = await db
      .insert(savingsContributions)
      .values({
        goalId,
        amount: data.amount,
        date,
        note: data.note || null,
        transactionId: data.transactionId || null,
      })
      .returning();

    // Recalculate current amount from all contributions
    const [updatedGoal] = await db
      .update(savingsGoals)
      .set({
        currentAmount: sql`(
          SELECT COALESCE(SUM(amount::numeric), 0)
          FROM wallet.savings_contributions
          WHERE goal_id = ${goalId}
        )::text`,
        updatedAt: new Date(),
      })
      .where(eq(savingsGoals.id, goalId))
      .returning();

    return { contribution, goal: updatedGoal };
  }

  // ─── Investments ─────────────────────────────────────────

  async listInvestments() {
    return db.select().from(investments).where(eq(investments.isActive, true));
  }

  async getInvestment(id: string) {
    const result = await db.select().from(investments).where(eq(investments.id, id));
    return result[0] ?? null;
  }

  async createInvestment(data: {
    name: string;
    type: string;
    accountId?: string | null;
    currency: string;
    investedAmount: string;
    currentValue: string;
    startDate: string;
    endDate?: string | null;
    rate?: string | null;
    notes?: string | null;
  }) {
    const [investment] = await db.insert(investments).values(data).returning();
    return investment;
  }

  async updateInvestment(id: string, data: Record<string, unknown>) {
    const [updated] = await db
      .update(investments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return updated ?? null;
  }

  async deactivateInvestment(id: string) {
    const [updated] = await db
      .update(investments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(investments.id, id))
      .returning();
    return updated ?? null;
  }

  // ─── Exchange Rates ──────────────────────────────────────

  async getLatestRates() {
    const result = await db.execute(sql`
      SELECT DISTINCT ON (from_currency, to_currency, type)
        id, from_currency, to_currency, rate, type, date, created_at
      FROM wallet.exchange_rates
      ORDER BY from_currency, to_currency, type, date DESC
    `);
    return result.rows;
  }

  async upsertExchangeRate(data: {
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    type: string;
    date: string;
  }) {
    const [rate] = await db
      .insert(exchangeRates)
      .values(data)
      .onConflictDoUpdate({
        target: [
          exchangeRates.fromCurrency,
          exchangeRates.toCurrency,
          exchangeRates.type,
          exchangeRates.date,
        ],
        set: {
          rate: data.rate,
          createdAt: new Date(),
        },
      })
      .returning();
    return rate;
  }

  // ─── Stats ───────────────────────────────────────────────

  async getSummary(filters: { month?: number; year?: number }) {
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
    const { month, year } = filters;
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

    return { balances: balances.rows, incomeExpense };
  }

  async getSpendingByCategory(filters: { from?: string; to?: string; currency?: string }) {
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
        ${filters.from ? sql`AND t.date >= ${filters.from}` : sql``}
        ${filters.to ? sql`AND t.date <= ${filters.to}` : sql``}
        ${filters.currency ? sql`AND t.currency = ${filters.currency}` : sql``}
      GROUP BY c.id, c.name, c.icon
      ORDER BY SUM(t.amount::numeric) DESC
    `);
    return result.rows;
  }

  async getMonthlyTrend() {
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
    return result.rows;
  }

  async getMonthlySummary(month?: number, year?: number) {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const endMonth = m === 12 ? 1 : m + 1;
    const endYear = m === 12 ? y + 1 : y;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const result = await db
      .select({
        currency: transactions.currency,
        totalIncome: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
        totalExpense: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
        net: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount}::numeric ELSE 0 END) - SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount}::numeric ELSE 0 END), 0)::text`,
      })
      .from(transactions)
      .where(and(gte(transactions.date, startDate), lte(transactions.date, endDate)))
      .groupBy(transactions.currency);

    return { month: m, year: y, data: result };
  }

  // ─── Private helpers ─────────────────────────────────────

  private async resolveDefaultAccount(currency: string): Promise<string> {
    const accs = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.currency, currency), eq(accounts.isActive, true)))
      .limit(1);
    if (accs.length === 0) throw new Error(`No active account found for currency ${currency}`);
    return accs[0].id;
  }
}

export const walletService = new WalletService();
