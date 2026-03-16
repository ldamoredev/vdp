import {
  pgSchema,
  uuid,
  varchar,
  decimal,
  boolean,
  timestamp,
  date,
  text,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const walletSchema = pgSchema("wallet");

// Accounts
export const accounts = walletSchema.table("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  initialBalance: decimal("initial_balance", {
    precision: 15,
    scale: 2,
  })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Categories
export const categories = walletSchema.table("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 60 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  icon: varchar("icon", { length: 30 }),
  parentId: uuid("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions
export const transactions = walletSchema.table(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    categoryId: uuid("category_id").references(() => categories.id),
    type: varchar("type", { length: 10 }).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    description: varchar("description", { length: 255 }),
    date: date("date").notNull(),
    transferToAccountId: uuid("transfer_to_account_id").references(
      () => accounts.id
    ),
    tags: text("tags").array().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("tx_account_date_idx").on(table.accountId, table.date),
    index("tx_category_date_idx").on(table.categoryId, table.date),
  ]
);

// Savings Goals
export const savingsGoals = walletSchema.table("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  targetAmount: decimal("target_amount", {
    precision: 15,
    scale: 2,
  }).notNull(),
  currentAmount: decimal("current_amount", {
    precision: 15,
    scale: 2,
  })
    .notNull()
    .default("0"),
  currency: varchar("currency", { length: 3 }).notNull(),
  deadline: date("deadline"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Savings Contributions
export const savingsContributions = walletSchema.table(
  "savings_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => savingsGoals.id),
    transactionId: uuid("transaction_id").references(() => transactions.id),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    date: date("date").notNull(),
    note: varchar("note", { length: 255 }),
  }
);

// Investments
export const investments = walletSchema.table("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  accountId: uuid("account_id").references(() => accounts.id),
  currency: varchar("currency", { length: 3 }).notNull(),
  investedAmount: decimal("invested_amount", {
    precision: 15,
    scale: 2,
  }).notNull(),
  currentValue: decimal("current_value", {
    precision: 15,
    scale: 2,
  }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  rate: decimal("rate", { precision: 6, scale: 4 }),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Exchange Rates
export const exchangeRates = walletSchema.table(
  "exchange_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
    toCurrency: varchar("to_currency", { length: 3 }).notNull(),
    rate: decimal("rate", { precision: 15, scale: 4 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    date: date("date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("exchange_rate_unique_idx").on(
      table.fromCurrency,
      table.toCurrency,
      table.type,
      table.date
    ),
  ]
);

