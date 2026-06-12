import { request } from "@/lib/api/client";
import type {
  Counter,
  CounterOverview,
  CountersOverviewResponse,
  GoalOverview,
  GoalsOverviewResponse,
  GraduateGoalResponse,
  Habit,
  HabitsOverviewResponse,
} from "@/lib/api/types";

export const healthApi = {
  getHabits: () => request<HabitsOverviewResponse>("/health/habits"),
  createHabit: (data: { name: string; emoji?: string | null }) =>
    request<Habit>("/health/habits", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  completeHabit: (habitId: string, date?: string) =>
    request<{ logged: boolean }>(`/health/habits/${habitId}/complete`, {
      method: "POST",
      body: JSON.stringify(date ? { date } : {}),
    }),
  uncompleteHabit: (habitId: string, date?: string) =>
    request<{ removed: boolean }>(`/health/habits/${habitId}/uncomplete`, {
      method: "POST",
      body: JSON.stringify(date ? { date } : {}),
    }),
  archiveHabit: (habitId: string) =>
    request<Habit>(`/health/habits/${habitId}/archive`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getCounters: () => request<CountersOverviewResponse>("/health/counters"),
  createCounter: (data: {
    name: string;
    emoji?: string | null;
    dailyCost?: string | null;
    startedAt?: string;
  }) =>
    request<CounterOverview>("/health/counters", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  relapseCounter: (counterId: string, date?: string) =>
    request<CounterOverview>(`/health/counters/${counterId}/relapse`, {
      method: "POST",
      body: JSON.stringify(date ? { date } : {}),
    }),
  archiveCounter: (counterId: string) =>
    request<Counter>(`/health/counters/${counterId}/archive`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  getGoals: () => request<GoalsOverviewResponse>("/health/goals"),
  createGoal: (data: { title: string; targetDate: string; notes?: string | null }) =>
    request<GoalOverview>("/health/goals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  completeGoal: (goalId: string) =>
    request<GoalOverview>(`/health/goals/${goalId}/complete`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  dropGoal: (goalId: string) =>
    request<GoalOverview>(`/health/goals/${goalId}/drop`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  graduateGoal: (goalId: string, data: { habitName: string; emoji?: string | null }) =>
    request<GraduateGoalResponse>(`/health/goals/${goalId}/graduate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
