import type {
  Category as CategoryDto,
  ExchangeRate as ExchangeRateDto,
  Investment as InvestmentDto,
  SavingsGoal as SavingsGoalDto,
  Transaction as TransactionDto,
} from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { groupCategoriesByType } from "../Category";
import { latestDollarRates } from "../ExchangeRate";
import { Investment, buildInvestmentSummary } from "../Investment";
import { SavingsGoal } from "../SavingsGoal";
import {
  Transaction,
  buildInitialTransactionFilters,
  buildTransactionPagination,
  buildVisibleTransactionTotal,
} from "../Transaction";

function categoryDto(overrides: Partial<CategoryDto> = {}): CategoryDto {
  return { id: "c1", name: "Comida", type: "expense", icon: null, ...overrides };
}

function transactionDto(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx1",
    accountId: "a1",
    categoryId: null,
    type: "expense",
    amount: "100",
    currency: "ARS",
    description: null,
    date: "2026-06-14",
    tags: [],
    createdAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

function investmentDto(overrides: Partial<InvestmentDto> = {}): InvestmentDto {
  return {
    id: "i1",
    name: "Plazo",
    type: "plazo_fijo",
    accountId: null,
    currency: "ARS",
    investedAmount: "1000",
    currentValue: "1100",
    startDate: "2026-01-01",
    endDate: null,
    rate: null,
    notes: null,
    isActive: true,
    ...overrides,
  };
}

function savingsDto(overrides: Partial<SavingsGoalDto> = {}): SavingsGoalDto {
  return {
    id: "s1",
    name: "Viaje",
    targetAmount: "1000",
    currentAmount: "250",
    currency: "ARS",
    deadline: null,
    isCompleted: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function rateDto(overrides: Partial<ExchangeRateDto> = {}): ExchangeRateDto {
  return {
    id: "r1",
    fromCurrency: "USD",
    toCurrency: "ARS",
    rate: "1000",
    type: "blue",
    date: "2026-06-14",
    ...overrides,
  };
}

describe("Transaction classification", () => {
  it("classifies by type and exposes a signed contribution", () => {
    expect(Transaction.from(transactionDto({ type: "income" })).isIncome).toBe(true);
    expect(Transaction.from(transactionDto({ type: "expense" })).isExpense).toBe(true);
    expect(Transaction.from(transactionDto({ type: "transfer" })).isTransfer).toBe(true);
    expect(Transaction.from(transactionDto({ type: "income", amount: "30" })).signedAmount).toBe(30);
    expect(Transaction.from(transactionDto({ type: "expense", amount: "30" })).signedAmount).toBe(-30);
    expect(Transaction.from(transactionDto({ type: "transfer", amount: "30" })).signedAmount).toBe(0);
  });
});

describe("buildVisibleTransactionTotal", () => {
  it("nets income and expense within a single currency", () => {
    const total = buildVisibleTransactionTotal([
      Transaction.from(transactionDto({ type: "income", amount: "500" })),
      Transaction.from(transactionDto({ type: "expense", amount: "200" })),
      Transaction.from(transactionDto({ type: "transfer", amount: "999" })),
    ]);

    expect(total.amount).toBe(300);
    expect(total.currency).toBe("ARS");
    expect(total.mixedCurrencies).toBe(false);
  });

  it("flags mixed currencies instead of summing across them", () => {
    const total = buildVisibleTransactionTotal([
      Transaction.from(transactionDto({ type: "income", amount: "100", currency: "ARS" })),
      Transaction.from(transactionDto({ type: "income", amount: "100", currency: "USD" })),
    ]);

    expect(total.currency).toBeNull();
    expect(total.mixedCurrencies).toBe(true);
  });
});

describe("buildTransactionPagination", () => {
  it("derives page state from limit/offset and total", () => {
    expect(buildTransactionPagination({ limit: "20", offset: "0" }, 50)).toEqual({
      currentPage: 1,
      totalPages: 3,
      canGoPrevious: false,
      canGoNext: true,
    });
    expect(buildTransactionPagination({ limit: "20", offset: "40" }, 50)).toEqual({
      currentPage: 3,
      totalPages: 3,
      canGoPrevious: true,
      canGoNext: false,
    });
  });
});

describe("buildInitialTransactionFilters", () => {
  it("defaults paging and takes the first value of array seeds", () => {
    expect(buildInitialTransactionFilters()).toEqual({
      limit: "20",
      offset: "0",
      from: undefined,
      to: undefined,
      type: undefined,
      categoryId: undefined,
    });
    expect(
      buildInitialTransactionFilters({ type: ["expense", "income"], from: "2026-06-01" }),
    ).toMatchObject({ type: "expense", from: "2026-06-01" });
  });

  it("ignores an invalid type seed", () => {
    expect(buildInitialTransactionFilters({ type: "bogus" }).type).toBeUndefined();
  });
});

describe("groupCategoriesByType", () => {
  it("splits into expense and income buckets", () => {
    const grouped = groupCategoriesByType([
      categoryDto({ id: "e", type: "expense" }),
      categoryDto({ id: "i", type: "income" }),
    ]);
    expect(grouped.expense.map((c) => c.id)).toEqual(["e"]);
    expect(grouped.income.map((c) => c.id)).toEqual(["i"]);
  });
});

describe("latestDollarRates", () => {
  it("keeps only USD→ARS rates ordered by type", () => {
    const rates = latestDollarRates([
      rateDto({ id: "blue", type: "blue" }),
      rateDto({ id: "ars-usd", fromCurrency: "ARS", toCurrency: "USD" }),
      rateDto({ id: "official", type: "official" }),
    ]);
    expect(rates.map((r) => r.id)).toEqual(["blue", "official"]);
  });
});

describe("SavingsGoal.progress", () => {
  it("clamps progress to 100 and handles a zero target", () => {
    expect(SavingsGoal.from(savingsDto({ currentAmount: "250", targetAmount: "1000" })).progress).toBe(25);
    expect(SavingsGoal.from(savingsDto({ currentAmount: "5000", targetAmount: "1000" })).progress).toBe(100);
    expect(SavingsGoal.from(savingsDto({ targetAmount: "0" })).progress).toBe(0);
  });
});

describe("buildInvestmentSummary", () => {
  it("rolls returns up within each currency, never across them", () => {
    const summary = buildInvestmentSummary([
      Investment.from(investmentDto({ currency: "ARS", investedAmount: "1000", currentValue: "1200" })),
      Investment.from(investmentDto({ currency: "ARS", investedAmount: "1000", currentValue: "900" })),
      Investment.from(investmentDto({ currency: "USD", investedAmount: "100", currentValue: "150" })),
    ]);

    expect(summary).toHaveLength(2);
    const ars = summary.find((s) => s.currency === "ARS")!;
    expect(ars.totalInvested).toBe(2000);
    expect(ars.totalCurrent).toBe(2100);
    expect(ars.totalReturn).toBe("5.0");
    expect(ars.positive).toBe(true);

    const usd = summary.find((s) => s.currency === "USD")!;
    expect(usd.totalInvested).toBe(100);
    expect(usd.totalCurrent).toBe(150);
    expect(usd.totalReturn).toBe("50.0");
  });

  it("returns 0.0 return when nothing is invested in a currency", () => {
    const summary = buildInvestmentSummary([
      Investment.from(investmentDto({ currency: "USD", investedAmount: "0", currentValue: "0" })),
    ]);
    expect(summary[0].totalReturn).toBe("0.0");
    expect(summary[0].positive).toBe(true);
  });
});
