import type { GoalOverview } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { Goal } from "@/core/domain/health/Goal";
import { HealthModule } from "@/core/app/health/HealthModule";
import { FakeHealthGateway } from "@/core/app/health/__tests__/fakes/FakeHealthGateway";
import { WalletModule } from "@/core/app/wallet/WalletModule";
import { FakeWalletGateway } from "@/core/app/wallet/__tests__/fakes/FakeWalletGateway";
import { HealthEvents } from "@/ui/events/HealthEvents";
import { GoalsPresenter } from "../GoalsPresenter";

function goal(overrides: Partial<GoalOverview> = {}): GoalOverview {
  return {
    id: "g1",
    title: "Gym",
    notes: null,
    targetDate: "2026-07-01",
    targetWeightKg: null,
    status: "active",
    completedAt: null,
    daysLeft: 5,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

function build(goals: GoalOverview[] = []) {
  const gateway = new FakeHealthGateway();
  vi.spyOn(gateway, "listGoals").mockResolvedValue({ goals: goals.map(Goal.from), date: "2026-06-13" });
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new HealthModule(gateway),
  );
  const events = new HealthEvents();
  const presenter = new GoalsPresenter(vi.fn(), core, events);
  presenter.init(undefined);
  return { presenter, gateway, events };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("GoalsPresenter", () => {
  it("gates creation on title and date", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    presenter.setNewTitle("Correr");
    expect(presenter.model.canCreate).toBe(false);
    presenter.setNewTargetDate("2026-08-01");
    expect(presenter.model.canCreate).toBe(true);
  });

  it("forwards optional target weight when creating a goal", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();

    presenter.setNewTitle("Bajar suave");
    presenter.setNewTargetDate("2026-08-01");
    presenter.setNewTargetWeight("78.50");
    await presenter.create();

    expect(gateway.callsTo("createGoal")[0].args).toEqual([
      { title: "Bajar suave", targetDate: "2026-08-01", targetWeightKg: "78.50" },
    ]);
  });

  it("formats the deadline label and urgency", async () => {
    const { presenter } = build([
      goal({ daysLeft: -2, targetWeightKg: "78.50" }),
      goal({ id: "g2", title: "Dieta", daysLeft: 1 }),
    ]);
    presenter.start();
    await flush();

    const [overdue, soon] = presenter.model.goals;
    expect(overdue.urgency).toBe("overdue");
    expect(overdue.deadlineLabel).toBe("venció hace 2 días");
    expect(overdue.targetWeightLabel).toBe("objetivo: 78.5 kg");
    expect(soon.deadlineLabel).toBe("vence mañana");
  });

  it("opens the graduation offer prefilled after completing a goal", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();

    await presenter.complete("g1");

    expect(gateway.callsTo("completeGoal")[0].args).toEqual(["g1"]);
    expect(presenter.model.graduation?.habitName).toBe("Gym");
    expect(presenter.model.graduation?.cadence).toBe("daily");
  });

  it("graduates and fires habitsChanged so habits reload elsewhere", async () => {
    const { presenter, gateway, events } = build();
    const onHabitsChanged = vi.fn();
    events.habitsChanged.subscribe({}, onHabitsChanged);
    presenter.start();
    await flush();
    await presenter.complete("g1");

    await presenter.graduate();

    expect(gateway.callsTo("graduateGoal")[0].args).toEqual(["g1", { habitName: "Gym", cadence: "daily" }]);
    expect(presenter.model.graduation).toBeNull();
    expect(onHabitsChanged).toHaveBeenCalledTimes(1);
  });

  it("graduates weekly habits with target cadence", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();
    await presenter.complete("g1");
    presenter.setGraduationCadence("weekly");
    presenter.setGraduationWeeklyTarget(3);

    await presenter.graduate();

    expect(gateway.callsTo("graduateGoal")[0].args).toEqual([
      "g1",
      { habitName: "Gym", cadence: "weekly", weeklyTarget: 3 },
    ]);
  });

  function buildWithWallet(goals: GoalOverview[], walletGateway: FakeWalletGateway) {
    const healthGateway = new FakeHealthGateway();
    vi.spyOn(healthGateway, "listGoals").mockResolvedValue({ goals: goals.map(Goal.from), date: "2026-06-13" });
    const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } })
      .use(new HealthModule(healthGateway))
      .use(new WalletModule(walletGateway));
    const presenter = new GoalsPresenter(vi.fn(), core, new HealthEvents());
    presenter.init(undefined);
    return presenter;
  }

  it("shows this week's delivery spend on an active weight goal, grouped by currency", async () => {
    const wallet = new FakeWalletGateway();
    const food = vi.spyOn(wallet, "getFoodSpendingThisWeek").mockResolvedValue({
      from: "2026-06-15",
      to: "2026-06-17",
      byCurrency: [
        { currency: "ARS", total: 12500, count: 3 },
        { currency: "USD", total: 20, count: 1 },
      ],
    });
    const presenter = buildWithWallet([goal({ id: "w1", title: "Bajar 5kg", targetWeightKg: "78.00" })], wallet);

    presenter.start();
    await flush();

    expect(food).toHaveBeenCalledTimes(1);
    const row = presenter.model.goals[0];
    expect(row.foodSpendingLabel).toContain("12.500");
    expect(row.foodSpendingLabel).toContain("4 pedidos");
    expect(row.foodSpendingHref).toBe("/wallet/transactions?type=expense&from=2026-06-15&to=2026-06-17");
  });

  it("does not query delivery spend when no active goal has a target weight", async () => {
    const wallet = new FakeWalletGateway();
    const food = vi.spyOn(wallet, "getFoodSpendingThisWeek");
    const presenter = buildWithWallet([goal({ id: "g1", title: "Leer", targetWeightKg: null })], wallet);

    presenter.start();
    await flush();

    expect(food).not.toHaveBeenCalled();
    expect(presenter.model.goals[0].foodSpendingLabel).toBeNull();
  });

  it("dismisses the graduation offer without graduating", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();
    await presenter.complete("g1");

    presenter.dismissGraduation();

    expect(presenter.model.graduation).toBeNull();
    expect(gateway.callsTo("graduateGoal")).toHaveLength(0);
  });
});
