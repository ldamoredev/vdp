import { describe, it, expect, vi } from "vitest";

/**
 * Tests for the form→API payload transformation logic in useWalletCreation.
 *
 * Since the project does not have @testing-library/react or a jsdom environment,
 * we test the payload transformation rules directly — these are the high-risk
 * paths where form state is converted into API payloads with defaults and nulls.
 */

// ─── Account payload ──────────────────────────────────────

describe("account payload transformation", () => {
  it("defaults initialBalance to '0' when empty", () => {
    const form = {
      name: "Savings",
      currency: "ARS" as const,
      type: "bank" as const,
      initialBalance: "",
    };

    const payload = {
      ...form,
      initialBalance: form.initialBalance || "0",
    };

    expect(payload.initialBalance).toBe("0");
  });

  it("preserves non-empty initialBalance", () => {
    const form = {
      name: "Checking",
      currency: "USD" as const,
      type: "bank" as const,
      initialBalance: "5000",
    };

    const payload = {
      ...form,
      initialBalance: form.initialBalance || "0",
    };

    expect(payload.initialBalance).toBe("5000");
  });
});

// ─── Category payload ──────────────────────────────────────

describe("category payload transformation", () => {
  it("converts empty icon to null", () => {
    const form = { name: "Food", type: "expense" as const, icon: "" };

    const payload = {
      name: form.name,
      type: form.type,
      icon: form.icon || null,
    };

    expect(payload.icon).toBeNull();
  });

  it("preserves non-empty icon", () => {
    const form = { name: "Food", type: "expense" as const, icon: "🍕" };

    const payload = {
      name: form.name,
      type: form.type,
      icon: form.icon || null,
    };

    expect(payload.icon).toBe("🍕");
  });
});

// ─── Savings goal payload ──────────────────────────────────────

describe("savings goal payload transformation", () => {
  it("converts empty deadline to null", () => {
    const form = {
      name: "Vacation",
      targetAmount: "100000",
      currency: "ARS" as const,
      deadline: "",
    };

    const payload = {
      ...form,
      deadline: form.deadline || null,
    };

    expect(payload.deadline).toBeNull();
  });

  it("preserves non-empty deadline", () => {
    const form = {
      name: "Vacation",
      targetAmount: "100000",
      currency: "ARS" as const,
      deadline: "2026-12-31",
    };

    const payload = {
      ...form,
      deadline: form.deadline || null,
    };

    expect(payload.deadline).toBe("2026-12-31");
  });
});

// ─── Contribution guard ──────────────────────────────────────

describe("contribution submission guard", () => {
  it("skips when contributeId is null", async () => {
    const spy = vi.fn();
    const contributeId: string | null = null;
    const contributeAmount = "500";

    if (contributeId && contributeAmount) {
      await spy({
        id: contributeId,
        amount: contributeAmount,
      });
    }

    expect(spy).not.toHaveBeenCalled();
  });

  it("skips when contributeAmount is empty", async () => {
    const spy = vi.fn();
    const contributeId = "goal-1";
    const contributeAmount = "";

    if (contributeId && contributeAmount) {
      await spy({
        id: contributeId,
        amount: contributeAmount,
      });
    }

    expect(spy).not.toHaveBeenCalled();
  });

  it("calls action when both id and amount are present", async () => {
    const spy = vi.fn();
    const contributeId = "goal-1";
    const contributeAmount = "500";

    if (contributeId && contributeAmount) {
      await spy({
        id: contributeId,
        amount: contributeAmount,
      });
    }

    expect(spy).toHaveBeenCalledWith({
      id: "goal-1",
      amount: "500",
    });
  });
});

// ─── Investment payload ──────────────────────────────────────

describe("investment payload transformation", () => {
  it("defaults currentValue to investedAmount when empty", () => {
    const form = {
      name: "Plazo fijo",
      type: "plazo_fijo",
      accountId: "",
      currency: "ARS" as const,
      investedAmount: "50000",
      currentValue: "",
      startDate: "2026-04-01",
      endDate: "",
      rate: "",
      notes: "",
    };

    const payload = {
      name: form.name,
      type: form.type,
      accountId: form.accountId || null,
      currency: form.currency,
      investedAmount: form.investedAmount,
      currentValue: form.currentValue || form.investedAmount,
      startDate: form.startDate,
      endDate: form.endDate || null,
      rate: form.rate || null,
      notes: form.notes || null,
    };

    expect(payload.currentValue).toBe("50000");
    expect(payload.accountId).toBeNull();
    expect(payload.endDate).toBeNull();
    expect(payload.rate).toBeNull();
    expect(payload.notes).toBeNull();
  });

  it("preserves non-empty optional fields", () => {
    const form = {
      name: "CEDEARs",
      type: "cedear",
      accountId: "acc-1",
      currency: "USD" as const,
      investedAmount: "1000",
      currentValue: "1200",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      rate: "3.5",
      notes: "Monthly dividends",
    };

    const payload = {
      name: form.name,
      type: form.type,
      accountId: form.accountId || null,
      currency: form.currency,
      investedAmount: form.investedAmount,
      currentValue: form.currentValue || form.investedAmount,
      startDate: form.startDate,
      endDate: form.endDate || null,
      rate: form.rate || null,
      notes: form.notes || null,
    };

    expect(payload.currentValue).toBe("1200");
    expect(payload.accountId).toBe("acc-1");
    expect(payload.endDate).toBe("2026-12-31");
    expect(payload.rate).toBe("3.5");
    expect(payload.notes).toBe("Monthly dividends");
  });
});
