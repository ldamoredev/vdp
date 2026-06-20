import { describe, expect, it } from "vitest";
import {
  buildDailyReviewProgress,
  buildMorningReviewSummary,
  buildTaskReviewSignals,
  buildWalletReviewSignals,
} from "../daily-review-selectors";

describe("buildWalletReviewSignals", () => {
  it("flags uncategorized and unusually concentrated spending for the review queue", () => {
    const result = buildWalletReviewSignals({
      transactions: [
        {
          id: "txn-1",
          accountId: "acc-1",
          categoryId: null,
          categoryName: undefined,
          type: "expense",
          amount: "24000",
          currency: "ARS",
          description: "Compra grande",
          date: "2026-04-10",
          tags: [],
          createdAt: "2026-04-10T10:00:00Z",
        },
      ],
      byCategory: [
        {
          categoryId: "cat-1",
          categoryName: "Supermercado",
          currency: "ARS",
          total: 24000,
          count: 1,
        },
      ],
      acknowledgedSignalIds: [],
    });

    expect(result.visibleSignals.map((signal) => signal.kind)).toEqual([
      "uncategorized",
      "category-spike",
    ]);
  });

  it("uses normalized category totals when calculating spending concentration", () => {
    const result = buildWalletReviewSignals({
      transactions: [
        {
          id: "usd-food",
          accountId: "acc-usd",
          categoryId: "food",
          categoryName: "Food",
          type: "expense",
          amount: "15",
          currency: "USD",
          description: "Delivery",
          date: "2026-04-10",
          tags: [],
          createdAt: "2026-04-10T10:00:00Z",
        },
        {
          id: "ars-transport",
          accountId: "acc-ars",
          categoryId: "transport",
          categoryName: "Transport",
          type: "expense",
          amount: "10000",
          currency: "ARS",
          description: "Taxi",
          date: "2026-04-10",
          tags: [],
          createdAt: "2026-04-10T11:00:00Z",
        },
        {
          id: "ars-market",
          accountId: "acc-ars",
          categoryId: "market",
          categoryName: "Market",
          type: "expense",
          amount: "10000",
          currency: "ARS",
          description: "Verduleria",
          date: "2026-04-10",
          tags: [],
          createdAt: "2026-04-10T12:00:00Z",
        },
      ],
      byCategory: [
        { categoryId: "food", categoryName: "Food", currency: "ARS", total: 15000, count: 1 },
        { categoryId: "transport", categoryName: "Transport", currency: "ARS", total: 10000, count: 1 },
        { categoryId: "market", categoryName: "Market", currency: "ARS", total: 10000, count: 1 },
      ],
      acknowledgedSignalIds: [],
    });

    expect(result.visibleSignals.map((signal) => signal.kind)).not.toContain("category-spike");
  });
});

describe("buildTaskReviewSignals", () => {
  it("flags carried-over tasks as needing review attention", () => {
    const result = buildTaskReviewSignals([
      {
        id: "task-1",
        title: "Cerrar presupuesto",
        priority: 3,
        status: "pending",
        carryOverCount: 2,
      },
    ]);

    expect(result.visibleSignals.map((signal) => signal.kind)).toEqual([
      "carry-over",
    ]);
  });
});

describe("buildDailyReviewProgress", () => {
  it("treats the ritual as complete only after tasks, wallet, and insights are resolved", () => {
    expect(
      buildDailyReviewProgress({
        pendingTasks: 0,
        unresolvedWalletSignals: 0,
        unresolvedInsights: 0,
        moodCheckedIn: true,
        note: "Manana revisar supermercado",
      }),
    ).toMatchObject({
      completed: true,
      label: "Ritual cerrado",
    });
  });
});

describe("buildMorningReviewSummary", () => {
  it("summarizes watched categories and note text for the next morning", () => {
    expect(
      buildMorningReviewSummary({
        watchedCategoryNames: ["Supermercado", "Transporte"],
        note: "No comprar fuera de lista",
      }),
    ).toContain("Supermercado");
  });
});
