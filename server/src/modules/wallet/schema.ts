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
import { users } from '../auth/infrastructure/schema';

export const walletSchema = pgSchema("wallet");

// Accounts
export const accounts = walletSchema.table("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Categories
export const categories = walletSchema.table(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 60 }).notNull(),
    type: varchar("type", { length: 10 }).notNull(),
    icon: varchar("icon", { length: 30 }),
    parentId: uuid("parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("categories_owner_user_idx").on(table.ownerUserId),
    index("categories_parent_id_idx").on(table.parentId),
  ]
);

// Transactions
export const transactions = walletSchema.table(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tx_owner_user_idx").on(table.ownerUserId),
    index("tx_account_date_idx").on(table.accountId, table.date),
    index("tx_category_date_idx").on(table.categoryId, table.date),
    index("tx_transfer_to_account_idx").on(table.transferToAccountId),
  ]
);

// Savings Goals
export const savingsGoals = walletSchema.table("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Savings Contributions
export const savingsContributions = walletSchema.table(
  "savings_contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => savingsGoals.id, { onDelete: "cascade" }),
    transactionId: uuid("transaction_id").references(() => transactions.id, {
      onDelete: "set null",
    }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    date: date("date").notNull(),
    note: varchar("note", { length: 255 }),
  },
  (table) => [
    index("sc_goal_id_idx").on(table.goalId),
    index("sc_transaction_id_idx").on(table.transactionId),
  ]
);

// Investments
export const investments = walletSchema.table("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
},
(table) => [index("investments_account_id_idx").on(table.accountId)]
);

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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
