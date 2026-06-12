import { request } from "@/lib/api/client";
import type { Habit, HabitsOverviewResponse } from "@/lib/api/types";

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
};
