import { describe, expect, it, vi } from "vitest";

import { Core } from "../../../Core";
import { Goal } from "../../../domain/health/Goal";
import { ArchiveCounter } from "../ArchiveCounter";
import { ArchiveHabit } from "../ArchiveHabit";
import { CompleteGoal } from "../CompleteGoal";
import { CompleteHabit } from "../CompleteHabit";
import { CreateCounter } from "../CreateCounter";
import { CreateGoal } from "../CreateGoal";
import { CreateHabit } from "../CreateHabit";
import { DropGoal } from "../DropGoal";
import { GetCountersOverview } from "../GetCountersOverview";
import { GetGoalsOverview } from "../GetGoalsOverview";
import { GetHabitCompletions } from "../GetHabitCompletions";
import { GetHabitsOverview } from "../GetHabitsOverview";
import { GetMoodCheckIns } from "../GetMoodCheckIns";
import { GetWeightTrend } from "../GetWeightTrend";
import { GraduateGoal } from "../GraduateGoal";
import { HealthModule } from "../HealthModule";
import { RelapseCounter } from "../RelapseCounter";
import { SaveMoodCheckIn } from "../SaveMoodCheckIn";
import { SaveWeightEntry } from "../SaveWeightEntry";
import { UncompleteHabit } from "../UncompleteHabit";
import { FakeHealthGateway } from "./fakes/FakeHealthGateway";

function coreWith(gateway: FakeHealthGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new HealthModule(gateway));
}

describe("health handlers (dispatched through the bus)", () => {
  describe("habits", () => {
    it("GetHabitsOverview reads the habits overview", async () => {
      const gateway = new FakeHealthGateway();
      const result = await coreWith(gateway).execute(new GetHabitsOverview());
      expect(gateway.callsTo("listHabits")).toHaveLength(1);
      expect(result.date).toBe("2026-06-13");
    });

    it("GetHabitCompletions forwards the habit and period", async () => {
      const gateway = new FakeHealthGateway();
      const result = await coreWith(gateway).execute(new GetHabitCompletions({
        habitId: "h1",
        from: "2026-06-01",
        to: "2026-06-30",
      }));

      expect(gateway.callsTo("getHabitCompletions")[0].args).toEqual([
        { habitId: "h1", from: "2026-06-01", to: "2026-06-30" },
      ]);
      expect(result.count).toBe(0);
    });

    it("CreateHabit forwards the input", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new CreateHabit({ name: "Leer" }));
      expect(gateway.callsTo("createHabit")[0].args).toEqual([{ name: "Leer" }]);
    });

    it("CompleteHabit and UncompleteHabit forward id and optional date", async () => {
      const gateway = new FakeHealthGateway();
      const core = coreWith(gateway);
      await core.execute(new CompleteHabit("h1"));
      await core.execute(new UncompleteHabit("h2", "2026-06-10"));
      expect(gateway.callsTo("completeHabit")[0].args).toEqual(["h1", undefined]);
      expect(gateway.callsTo("uncompleteHabit")[0].args).toEqual(["h2", "2026-06-10"]);
    });

    it("ArchiveHabit forwards the id", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new ArchiveHabit("h9"));
      expect(gateway.callsTo("archiveHabit")[0].args).toEqual(["h9"]);
    });
  });

  describe("counters", () => {
    it("GetCountersOverview reads the counters overview", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new GetCountersOverview());
      expect(gateway.callsTo("listCounters")).toHaveLength(1);
    });

    it("CreateCounter, RelapseCounter and ArchiveCounter forward their args", async () => {
      const gateway = new FakeHealthGateway();
      const core = coreWith(gateway);
      await core.execute(new CreateCounter({ name: "Sin fumar", dailyCost: "500" }));
      await core.execute(new RelapseCounter("c1", "2026-06-09"));
      await core.execute(new ArchiveCounter("c2"));
      expect(gateway.callsTo("createCounter")[0].args).toEqual([{ name: "Sin fumar", dailyCost: "500" }]);
      expect(gateway.callsTo("relapseCounter")[0].args).toEqual(["c1", "2026-06-09"]);
      expect(gateway.callsTo("archiveCounter")[0].args).toEqual(["c2"]);
    });
  });

  describe("goals", () => {
    it("GetGoalsOverview reads the goals overview", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new GetGoalsOverview());
      expect(gateway.callsTo("listGoals")).toHaveLength(1);
    });

    it("CreateGoal forwards the input", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new CreateGoal({ title: "Gym", targetDate: "2026-07-01" }));
      expect(gateway.callsTo("createGoal")[0].args).toEqual([{ title: "Gym", targetDate: "2026-07-01" }]);
    });

    it("CompleteGoal returns the completed Goal for the graduation flow", async () => {
      const gateway = new FakeHealthGateway();
      const result = await coreWith(gateway).execute(new CompleteGoal("g1"));
      expect(gateway.callsTo("completeGoal")[0].args).toEqual(["g1"]);
      expect(result).toBeInstanceOf(Goal);
      expect(result.id).toBe("g1");
    });

    it("DropGoal and GraduateGoal forward their args", async () => {
      const gateway = new FakeHealthGateway();
      const core = coreWith(gateway);
      await core.execute(new DropGoal("g2"));
      await core.execute(new GraduateGoal("g3", { habitName: "Gimnasio" }));
      expect(gateway.callsTo("dropGoal")[0].args).toEqual(["g2"]);
      expect(gateway.callsTo("graduateGoal")[0].args).toEqual(["g3", { habitName: "Gimnasio" }]);
    });
  });

  describe("mood check-ins", () => {
    it("GetMoodCheckIns reads the weekly check-in overview", async () => {
      const gateway = new FakeHealthGateway();
      const result = await coreWith(gateway).execute(new GetMoodCheckIns(7));
      expect(gateway.callsTo("listMoodCheckIns")[0].args).toEqual([7]);
      expect(result.date).toBe("2026-06-13");
    });

    it("SaveMoodCheckIn forwards the input", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new SaveMoodCheckIn({ mood: 2, energy: 4 }));
      expect(gateway.callsTo("saveMoodCheckIn")[0].args).toEqual([{ mood: 2, energy: 4 }]);
    });
  });

  describe("weight trend", () => {
    it("GetWeightTrend reads the weight overview", async () => {
      const gateway = new FakeHealthGateway();
      const result = await coreWith(gateway).execute(new GetWeightTrend(30));
      expect(gateway.callsTo("getWeightTrend")[0].args).toEqual([30]);
      expect(result.date).toBe("2026-06-13");
    });

    it("SaveWeightEntry forwards the input", async () => {
      const gateway = new FakeHealthGateway();
      await coreWith(gateway).execute(new SaveWeightEntry({ weightKg: "82.10" }));
      expect(gateway.callsTo("saveWeightEntry")[0].args).toEqual([{ weightKg: "82.10" }]);
    });
  });
});
