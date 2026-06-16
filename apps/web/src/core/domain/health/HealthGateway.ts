import type { Counter } from "./Counter";
import type { Goal } from "./Goal";
import type { Habit } from "./Habit";
import type { HabitCadence } from "@vdp/shared";

export interface CreateHabitInput {
  name: string;
  emoji?: string | null;
  cadence?: HabitCadence;
  weeklyTarget?: number | null;
}

export interface CreateCounterInput {
  name: string;
  emoji?: string | null;
  dailyCost?: string | null;
  startedAt?: string;
}

export interface CreateGoalInput {
  title: string;
  targetDate: string;
  notes?: string | null;
}

export interface GraduateGoalInput {
  habitName: string;
  emoji?: string | null;
  cadence?: HabitCadence;
  weeklyTarget?: number | null;
}

export interface HabitsOverview {
  habits: Habit[];
  date: string;
}

export interface CountersOverview {
  counters: Counter[];
  date: string;
}

export interface GoalsOverview {
  goals: Goal[];
  date: string;
}

/**
 * Port for the health backend. Reads return domain models; writes the UI does
 * not consume the result of return void (the presenter re-queries via a
 * ui/events signal). completeGoal returns the Goal because the graduation flow
 * needs its id/title immediately. Implemented by HttpHealthGateway; faked in
 * application-service tests.
 */
export interface HealthGateway {
  listHabits(): Promise<HabitsOverview>;
  createHabit(input: CreateHabitInput): Promise<void>;
  completeHabit(habitId: string, date?: string): Promise<void>;
  uncompleteHabit(habitId: string, date?: string): Promise<void>;
  archiveHabit(habitId: string): Promise<void>;

  listCounters(): Promise<CountersOverview>;
  createCounter(input: CreateCounterInput): Promise<void>;
  relapseCounter(counterId: string, date?: string): Promise<void>;
  archiveCounter(counterId: string): Promise<void>;

  listGoals(): Promise<GoalsOverview>;
  createGoal(input: CreateGoalInput): Promise<void>;
  completeGoal(goalId: string): Promise<Goal>;
  dropGoal(goalId: string): Promise<void>;
  graduateGoal(goalId: string, input: GraduateGoalInput): Promise<void>;
}
