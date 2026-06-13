import type { CounterOverview } from "@vdp/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { HealthModule } from "@/core/app/health/HealthModule";
import { FakeHealthGateway } from "@/core/app/health/__tests__/fakes/FakeHealthGateway";
import { CountersPresenter } from "../CountersPresenter";

function counter(overrides: Partial<CounterOverview> = {}): CounterOverview {
  return {
    id: "c1",
    name: "Sin fumar",
    emoji: null,
    dailyCost: null,
    startedAt: "2026-01-01",
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
    currentDays: 90,
    bestDays: 90,
    attemptCount: 1,
    moneyNotSpent: null,
    ...overrides,
  };
}

function build(counters: CounterOverview[] = []) {
  const gateway = new FakeHealthGateway();
  vi.spyOn(gateway, "listCounters").mockResolvedValue({ counters, date: "2026-06-13" });
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new HealthModule(gateway),
  );
  const presenter = new CountersPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway };
}

describe("CountersPresenter", () => {
  afterEach(() => vi.useRealTimers());

  it("creates a counter, normalizing empty daily cost to null", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await vi.waitFor(() => expect(presenter.model.isLoading).toBe(false));

    presenter.setNewName("Sin azúcar");
    await presenter.create();

    expect(gateway.callsTo("createCounter")[0].args).toEqual([
      { name: "Sin azúcar", dailyCost: null, startedAt: undefined },
    ]);
  });

  it("formats the money-not-spent label when a daily cost yields savings", async () => {
    const { presenter } = build([counter({ moneyNotSpent: "45000" })]);
    presenter.start();
    await vi.waitFor(() => expect(presenter.model.counters.length).toBe(1));
    expect(presenter.model.counters[0].moneyNotSpentLabel).toContain("que no se fueron");
  });

  it("requires two relapse calls and shows the confirm state in between", async () => {
    vi.useFakeTimers();
    const { presenter, gateway } = build([counter()]);
    presenter.start();
    await vi.runAllTimersAsync();

    presenter.requestRelapse("c1");
    expect(presenter.model.counters[0].confirmingRelapse).toBe(true);
    expect(gateway.callsTo("relapseCounter")).toHaveLength(0);

    presenter.requestRelapse("c1");
    await vi.runAllTimersAsync();
    expect(gateway.callsTo("relapseCounter")[0].args).toEqual(["c1", undefined]);
  });

  it("auto-clears the confirm state after the timeout without relapsing", async () => {
    vi.useFakeTimers();
    const { presenter, gateway } = build([counter()]);
    presenter.start();
    await vi.runAllTimersAsync();

    presenter.requestRelapse("c1");
    expect(presenter.model.counters[0].confirmingRelapse).toBe(true);

    await vi.advanceTimersByTimeAsync(4000);
    expect(presenter.model.counters[0].confirmingRelapse).toBe(false);
    expect(gateway.callsTo("relapseCounter")).toHaveLength(0);
  });
});
