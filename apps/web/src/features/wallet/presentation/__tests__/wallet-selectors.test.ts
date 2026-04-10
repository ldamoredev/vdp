import { describe, expect, it } from "vitest";
import {
  buildInitialTransactionFilters,
  buildInvestmentSummary,
  buildTransactionPagination,
  calculateSavingsProgress,
  latestDollarRates,
} from "../wallet-selectors";

describe("wallet-selectors", () => {
  it("filters USD to ARS exchange rates", () => {
    const result = latestDollarRates([
      {
        id: "1",
        fromCurrency: "USD",
        toCurrency: "ARS",
        rate: "1100.00",
        type: "blue",
        date: "2026-03-27",
      },
      {
        id: "2",
        fromCurrency: "ARS",
        toCurrency: "USD",
        rate: "0.0009",
        type: "official",
        date: "2026-03-27",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("blue");
  });

  it("calculates savings progress capped at one hundred percent", () => {
    const result = calculateSavingsProgress({
      id: "goal-1",
      name: "Emergency fund",
      targetAmount: "1000",
      currentAmount: "1250",
      currency: "USD",
      deadline: null,
      isCompleted: true,
      createdAt: "2026-03-20",
    });

    expect(result.current).toBe(1250);
    expect(result.target).toBe(1000);
    expect(result.progress).toBe(100);
  });

  it("builds investment summary totals and return", () => {
    const result = buildInvestmentSummary([
      {
        id: "inv-1",
        name: "ETF",
        type: "cedear",
        currency: "USD",
        investedAmount: "1000",
        currentValue: "1120",
        startDate: "2026-01-01",
        endDate: null,
        rate: null,
        notes: null,
        isActive: true,
      },
      {
        id: "inv-2",
        name: "FCI",
        type: "fci",
        currency: "ARS",
        investedAmount: "500",
        currentValue: "450",
        startDate: "2026-02-01",
        endDate: null,
        rate: null,
        notes: null,
        isActive: true,
      },
    ]);

    expect(result.totalInvested).toBe(1500);
    expect(result.totalCurrent).toBe(1570);
    expect(result.totalReturn).toBe("4.7");
    expect(result.positive).toBe(true);
  });

  it("builds transaction pagination state", () => {
    const result = buildTransactionPagination(
      { limit: "20", offset: "20" },
      45,
    );

    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.canGoPrevious).toBe(true);
    expect(result.canGoNext).toBe(true);
  });

  it("seeds transaction filters from route query params", () => {
    const result = buildInitialTransactionFilters({
      from: "2026-03-30",
      to: "2026-04-05",
      type: "expense",
      categoryId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result).toEqual({
      limit: "20",
      offset: "0",
      from: "2026-03-30",
      to: "2026-04-05",
      type: "expense",
      categoryId: "123e4567-e89b-12d3-a456-426614174000",
    });
  });

  it("omits category filters when they are absent", () => {
    const result = buildInitialTransactionFilters({
      from: "2026-03-30",
    });

    expect(result).toEqual({
      limit: "20",
      offset: "0",
      from: "2026-03-30",
      to: undefined,
    });
    expect(result.type).toBeUndefined();
    expect(result.categoryId).toBeUndefined();
  });
});
