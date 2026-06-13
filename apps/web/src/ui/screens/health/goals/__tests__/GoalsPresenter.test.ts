import type { GoalOverview } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { Goal } from "@/core/domain/health/Goal";
import { HealthModule } from "@/core/app/health/HealthModule";
import { FakeHealthGateway } from "@/core/app/health/__tests__/fakes/FakeHealthGateway";
import { HealthEvents } from "@/ui/events/HealthEvents";
import { GoalsPresenter } from "../GoalsPresenter";

function goal(overrides: Partial<GoalOverview> = {}): GoalOverview {
  return {
    id: "g1",
    title: "Gym",
    notes: null,
    targetDate: "2026-07-01",
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

  it("formats the deadline label and urgency", async () => {
    const { presenter } = build([goal({ daysLeft: -2 }), goal({ id: "g2", title: "Dieta", daysLeft: 1 })]);
    presenter.start();
    await flush();

    const [overdue, soon] = presenter.model.goals;
    expect(overdue.urgency).toBe("overdue");
    expect(overdue.deadlineLabel).toBe("venció hace 2 días");
    expect(soon.deadlineLabel).toBe("vence mañana");
  });

  it("opens the graduation offer prefilled after completing a goal", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();

    await presenter.complete("g1");

    expect(gateway.callsTo("completeGoal")[0].args).toEqual(["g1"]);
    expect(presenter.model.graduation?.habitName).toBe("Gym");
  });

  it("graduates and fires habitsChanged so habits reload elsewhere", async () => {
    const { presenter, gateway, events } = build();
    const onHabitsChanged = vi.fn();
    events.habitsChanged.subscribe({}, onHabitsChanged);
    presenter.start();
    await flush();
    await presenter.complete("g1");

    await presenter.graduate();

    expect(gateway.callsTo("graduateGoal")[0].args).toEqual(["g1", { habitName: "Gym" }]);
    expect(presenter.model.graduation).toBeNull();
    expect(onHabitsChanged).toHaveBeenCalledTimes(1);
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
