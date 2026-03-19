import { z } from "zod";
import {
  dateRangeSchema,
  dateStringSchema,
  nullableDateStringSchema,
  optionalDateStringSchema,
  uuidSchema,
} from "./common";

const currencyEnum = z.enum(["ARS", "USD"]);
const accountTypeEnum = z.enum(["cash", "bank", "crypto", "investment"]);
const transactionTypeEnum = z.enum(["income", "expense", "transfer"]);
const categoryTypeEnum = z.enum(["income", "expense"]);
const investmentTypeEnum = z.enum([
  "plazo_fijo",
  "fci",
  "cedear",
  "crypto",
  "bond",
  "other",
]);
const exchangeRateTypeEnum = z.enum(["official", "blue", "mep", "ccl"]);

// Accounts
export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  currency: currencyEnum,
  type: accountTypeEnum,
  initialBalance: z.string().default("0"),
});

export const updateAccountSchema = createAccountSchema.partial();

// Categories
export const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  type: categoryTypeEnum,
  icon: z.string().max(30).nullable().optional(),
  parentId: uuidSchema.nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Transactions
export const createTransactionSchema = z.object({
  accountId: uuidSchema,
  categoryId: uuidSchema.nullable().optional(),
  type: transactionTypeEnum,
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  currency: currencyEnum,
  description: z.string().max(255).nullable().optional(),
  date: dateStringSchema,
  transferToAccountId: uuidSchema.nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFiltersSchema = dateRangeSchema.extend({
  accountId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
  type: transactionTypeEnum.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Savings
export const createSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.string().refine((v) => parseFloat(v) > 0),
  currency: currencyEnum,
  deadline: nullableDateStringSchema,
});

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

export const createContributionSchema = z.object({
  goalId: uuidSchema,
  transactionId: uuidSchema.nullable().optional(),
  amount: z.string().refine((v) => parseFloat(v) > 0),
  date: dateStringSchema,
  note: z.string().max(255).nullable().optional(),
});

// Investments
export const createInvestmentSchema = z.object({
  name: z.string().min(1).max(100),
  type: investmentTypeEnum,
  accountId: uuidSchema.nullable().optional(),
  currency: currencyEnum,
  investedAmount: z.string().refine((v) => parseFloat(v) > 0),
  currentValue: z.string().refine((v) => parseFloat(v) >= 0),
  startDate: dateStringSchema,
  endDate: nullableDateStringSchema,
  rate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateInvestmentSchema = createInvestmentSchema.partial();

// Exchange Rates
export const createExchangeRateSchema = z.object({
  fromCurrency: currencyEnum,
  toCurrency: currencyEnum,
  rate: z.string().refine((v) => parseFloat(v) > 0),
  type: exchangeRateTypeEnum,
  date: dateStringSchema,
});

// Stats
export const statsQuerySchema = dateRangeSchema.extend({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).optional(),
  currency: currencyEnum.optional(),
});
