import type { GoalOverview, MoodCheckIn, WeightEntry } from "@vdp/shared";

import { Goal } from "../../../../domain/health/Goal";
import type {
  CountersOverview,
  CreateCounterInput,
  CreateGoalInput,
  CreateHabitInput,
  GoalsOverview,
  GraduateGoalInput,
  HabitsOverview,
  HealthGateway,
  MoodCheckInsOverview,
  SaveMoodCheckInInput,
  SaveWeightEntryInput,
  WeightTrendOverview,
} from "../../../../domain/health/HealthGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

const emptyGoalDto: GoalOverview = {
  id: "g1",
  title: "Gym",
  notes: null,
  targetDate: "2026-07-01",
  targetWeightKg: null,
  status: "done",
  completedAt: "2026-06-13T00:00:00.000Z",
  daysLeft: 3,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

/**
 * Records every call so handler tests can assert routing and argument
 * forwarding without HTTP. Reads return empty overviews; completeGoal returns
 * a canned Goal.
 */
export class FakeHealthGateway implements HealthGateway {
  readonly calls: RecordedCall[] = [];
  completeGoalResult = Goal.from(emptyGoalDto);
  private moodCheckIns: MoodCheckIn[] = [];
  private weightEntries: WeightEntry[] = [];

  private record(method: string, ...args: unknown[]) {
    this.calls.push({ method, args });
  }

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  async listHabits(): Promise<HabitsOverview> {
    this.record("listHabits");
    return { habits: [], date: "2026-06-13" };
  }
  async createHabit(input: CreateHabitInput): Promise<void> {
    this.record("createHabit", input);
  }
  async completeHabit(habitId: string, date?: string): Promise<void> {
    this.record("completeHabit", habitId, date);
  }
  async uncompleteHabit(habitId: string, date?: string): Promise<void> {
    this.record("uncompleteHabit", habitId, date);
  }
  async archiveHabit(habitId: string): Promise<void> {
    this.record("archiveHabit", habitId);
  }

  async listCounters(): Promise<CountersOverview> {
    this.record("listCounters");
    return { counters: [], date: "2026-06-13" };
  }
  async createCounter(input: CreateCounterInput): Promise<void> {
    this.record("createCounter", input);
  }
  async relapseCounter(counterId: string, date?: string): Promise<void> {
    this.record("relapseCounter", counterId, date);
  }
  async archiveCounter(counterId: string): Promise<void> {
    this.record("archiveCounter", counterId);
  }

  async listGoals(): Promise<GoalsOverview> {
    this.record("listGoals");
    return { goals: [], date: "2026-06-13" };
  }
  async createGoal(input: CreateGoalInput): Promise<void> {
    this.record("createGoal", input);
  }
  async completeGoal(goalId: string): Promise<Goal> {
    this.record("completeGoal", goalId);
    return this.completeGoalResult;
  }
  async dropGoal(goalId: string): Promise<void> {
    this.record("dropGoal", goalId);
  }
  async graduateGoal(goalId: string, input: GraduateGoalInput): Promise<void> {
    this.record("graduateGoal", goalId, input);
  }

  async listMoodCheckIns(days?: number): Promise<MoodCheckInsOverview> {
    this.record("listMoodCheckIns", days);
    return {
      checkIns: this.moodCheckIns,
      date: "2026-06-13",
      summary: {
        days: days ?? 7,
        checkInCount: this.moodCheckIns.length,
        averageMood: this.moodCheckIns.length > 0 ? this.moodCheckIns[0].mood : null,
        averageEnergy: this.moodCheckIns.length > 0 ? this.moodCheckIns[0].energy : null,
        habitCompletionRate: 50,
      },
    };
  }

  async saveMoodCheckIn(input: SaveMoodCheckInInput): Promise<MoodCheckIn> {
    this.record("saveMoodCheckIn", input);
    const checkIn: MoodCheckIn = {
      id: "m1",
      date: input.date ?? "2026-06-13",
      mood: input.mood,
      energy: input.energy,
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
    };
    this.moodCheckIns = [checkIn];
    return checkIn;
  }

  async getWeightTrend(days?: number): Promise<WeightTrendOverview> {
    this.record("getWeightTrend", days);
    return {
      entries: this.weightEntries,
      date: "2026-06-13",
      summary: {
        days: days ?? 30,
        entryCount: this.weightEntries.length,
        currentWeightKg: this.weightEntries.at(-1)?.weightKg ?? null,
        previousWeightKg: this.weightEntries.length > 1 ? this.weightEntries[0].weightKg : null,
        changeKg: null,
        direction: "flat",
      },
    };
  }

  async saveWeightEntry(input: SaveWeightEntryInput): Promise<WeightEntry> {
    this.record("saveWeightEntry", input);
    const entry: WeightEntry = {
      id: "w1",
      date: input.date ?? "2026-06-13",
      weightKg: input.weightKg,
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
    };
    this.weightEntries = [entry];
    return entry;
  }
}
