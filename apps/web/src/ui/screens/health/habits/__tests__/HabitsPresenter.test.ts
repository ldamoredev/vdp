import type { HabitOverview } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { HealthModule } from "@/core/app/health/HealthModule";
import { FakeHealthGateway } from "@/core/app/health/__tests__/fakes/FakeHealthGateway";
import { HealthEvents } from "@/ui/events/HealthEvents";
import { HabitsPresenter } from "../HabitsPresenter";

function habit(overrides: Partial<HabitOverview> = {}): HabitOverview {
  return {
    id: "h1",
    name: "Leer",
    emoji: null,
    cadence: "daily",
    weeklyTarget: null,
    archivedAt: null,
    createdAt: "",
    updatedAt: "",
    completedToday: false,
    periodCompletions: 0,
    periodTarget: 1,
    streak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    lastCompletedDate: null,
    ...overrides,
  };
}

function build(gateway = new FakeHealthGateway()) {
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new HealthModule(gateway),
  );
  const events = new HealthEvents();
  const presenter = new HabitsPresenter(vi.fn(), core, events);
  presenter.init(undefined);
  return { presenter, gateway, events };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("HabitsPresenter", () => {
  it("loads habits on start and clears the loading flag", async () => {
    const { presenter } = build();
    expect(presenter.model.isLoading).toBe(true);
    presenter.start();
    await flush();
    expect(presenter.model.isLoading).toBe(false);
  });

  it("gates creation on a non-empty name and re-queries after", async () => {
    const { presenter, gateway } = build();
    presenter.setNewHabitName("  ");
    expect(presenter.model.canCreate).toBe(false);
    presenter.setNewHabitName("Meditar");
    expect(presenter.model.canCreate).toBe(true);

    await presenter.createHabit();

    expect(gateway.callsTo("createHabit")[0].args).toEqual([{ name: "Meditar", cadence: "daily" }]);
    expect(presenter.model.newHabitName).toBe("");
  });

  it("creates weekly habits with a target", async () => {
    const { presenter, gateway } = build();
    presenter.setNewHabitName("Gimnasio");
    presenter.setNewHabitCadence("weekly");
    presenter.setNewHabitWeeklyTarget(3);

    await presenter.createHabit();

    expect(gateway.callsTo("createHabit")[0].args).toEqual([
      { name: "Gimnasio", cadence: "weekly", weeklyTarget: 3 },
    ]);
  });

  it("toggles to uncomplete when the habit is already done", async () => {
    const gateway = new FakeHealthGateway();
    vi.spyOn(gateway, "listHabits").mockResolvedValue({
      habits: [habit({ completedToday: true })],
      date: "2026-06-13",
    });
    const { presenter } = build(gateway);
    presenter.start();
    await flush();

    await presenter.toggle("h1");

    expect(gateway.callsTo("uncompleteHabit")[0].args).toEqual(["h1", undefined]);
    expect(gateway.callsTo("completeHabit")).toHaveLength(0);
  });

  it("formats display name, streak badge and label", async () => {
    const gateway = new FakeHealthGateway();
    vi.spyOn(gateway, "listHabits").mockResolvedValue({
      habits: [habit({ emoji: "📖", streak: 4, bestStreak: 4 })],
      date: "2026-06-13",
    });
    const { presenter } = build(gateway);
    presenter.start();
    await flush();

    const [vm] = presenter.model.habits;
    expect(vm.displayName).toBe("📖 Leer");
    expect(vm.showStreakBadge).toBe(true);
    expect(vm.streakLabel).toBe("4 días seguidos");
  });

  it("formats weekly cadence, progress and week streak labels", async () => {
    const gateway = new FakeHealthGateway();
    vi.spyOn(gateway, "listHabits").mockResolvedValue({
      habits: [
        habit({
          name: "Gimnasio",
          cadence: "weekly",
          weeklyTarget: 3,
          periodCompletions: 2,
          periodTarget: 3,
          streak: 2,
        }),
      ],
      date: "2026-06-13",
    });
    const { presenter } = build(gateway);
    presenter.start();
    await flush();

    const [vm] = presenter.model.habits;
    expect(vm.cadenceLabel).toBe("3/semana");
    expect(vm.progressLabel).toBe("2/3 esta semana");
    expect(vm.streakLabel).toBe("2 semanas seguidas");
  });

  it("reloads when habitsChanged fires (a goal graduated elsewhere)", async () => {
    const { presenter, gateway, events } = build();
    presenter.start();
    await flush();
    const before = gateway.callsTo("listHabits").length;

    await events.emitHabitsChanged();
    await flush();

    expect(gateway.callsTo("listHabits").length).toBe(before + 1);
  });

  it("stops listening to habitsChanged after stop()", async () => {
    const { presenter, gateway, events } = build();
    presenter.start();
    await flush();
    presenter.stop();
    const before = gateway.callsTo("listHabits").length;

    await events.emitHabitsChanged();
    await flush();

    expect(gateway.callsTo("listHabits").length).toBe(before);
  });

  it("sets the error flag when the load fails", async () => {
    const gateway = new FakeHealthGateway();
    vi.spyOn(gateway, "listHabits").mockRejectedValueOnce(new Error("boom"));
    const { presenter } = build(gateway);
    presenter.start();
    await flush();
    expect(presenter.model.error).toBe(true);
  });
});
