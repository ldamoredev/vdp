import { HttpClient } from "@nbottarini/abstract-http-client";
import type {
  CountersOverviewResponse,
  GoalOverview,
  GoalsOverviewResponse,
  HabitCompletionsResponse,
  HabitsOverviewResponse,
  MoodCheckIn,
  MoodCheckInsResponse,
  WeightEntry,
  WeightTrendResponse,
} from "@vdp/shared";

import { Goal } from "../../domain/health/Goal";
import type {
  CountersOverview,
  CreateCounterInput,
  CreateGoalInput,
  CreateHabitInput,
  GetHabitCompletionsInput,
  GoalsOverview,
  GraduateGoalInput,
  HabitsOverview,
  HealthGateway,
  MoodCheckInsOverview,
  SaveMoodCheckInInput,
  SaveWeightEntryInput,
  WeightTrendOverview,
} from "../../domain/health/HealthGateway";

/**
 * HTTP adapter for the health backend: translates wire DTOs (@vdp/shared) into
 * domain models. The anti-corruption boundary — DTO shapes never leak past it.
 */
export class HttpHealthGateway implements HealthGateway {
  constructor(private readonly http: HttpClient) {}

  async listHabits(): Promise<HabitsOverview> {
    const { body } = await this.http.get<HabitsOverviewResponse>("/health/habits");
    return { habits: body.habits, date: body.date };
  }

  async getHabitCompletions(input: GetHabitCompletionsInput): Promise<HabitCompletionsResponse> {
    const query = `from=${encodeURIComponent(input.from)}&to=${encodeURIComponent(input.to)}`;
    const { body } = await this.http.get<HabitCompletionsResponse>(
      `/health/habits/${input.habitId}/completions?${query}`,
    );
    return body;
  }

  async createHabit(input: CreateHabitInput): Promise<void> {
    await this.http.post("/health/habits", input);
  }

  async completeHabit(habitId: string, date?: string): Promise<void> {
    await this.http.post(`/health/habits/${habitId}/complete`, date ? { date } : {});
  }

  async uncompleteHabit(habitId: string, date?: string): Promise<void> {
    await this.http.post(`/health/habits/${habitId}/uncomplete`, date ? { date } : {});
  }

  async archiveHabit(habitId: string): Promise<void> {
    await this.http.post(`/health/habits/${habitId}/archive`, {});
  }

  async listCounters(): Promise<CountersOverview> {
    const { body } = await this.http.get<CountersOverviewResponse>("/health/counters");
    return { counters: body.counters, date: body.date };
  }

  async createCounter(input: CreateCounterInput): Promise<void> {
    await this.http.post("/health/counters", input);
  }

  async relapseCounter(counterId: string, date?: string): Promise<void> {
    await this.http.post(`/health/counters/${counterId}/relapse`, date ? { date } : {});
  }

  async archiveCounter(counterId: string): Promise<void> {
    await this.http.post(`/health/counters/${counterId}/archive`, {});
  }

  async listGoals(): Promise<GoalsOverview> {
    const { body } = await this.http.get<GoalsOverviewResponse>("/health/goals");
    return { goals: body.goals.map(Goal.from), date: body.date };
  }

  async createGoal(input: CreateGoalInput): Promise<void> {
    await this.http.post("/health/goals", input);
  }

  async completeGoal(goalId: string): Promise<Goal> {
    const { body } = await this.http.post<GoalOverview>(`/health/goals/${goalId}/complete`, {});
    return Goal.from(body);
  }

  async dropGoal(goalId: string): Promise<void> {
    await this.http.post(`/health/goals/${goalId}/drop`, {});
  }

  async graduateGoal(goalId: string, input: GraduateGoalInput): Promise<void> {
    await this.http.post(`/health/goals/${goalId}/graduate`, input);
  }

  async listMoodCheckIns(days?: number): Promise<MoodCheckInsOverview> {
    const query = days ? `?days=${encodeURIComponent(String(days))}` : "";
    const { body } = await this.http.get<MoodCheckInsResponse>(`/health/mood-check-ins${query}`);
    return body;
  }

  async saveMoodCheckIn(input: SaveMoodCheckInInput): Promise<MoodCheckIn> {
    const { body } = await this.http.put<MoodCheckIn>("/health/mood-check-ins", input);
    return body;
  }

  async getWeightTrend(days?: number): Promise<WeightTrendOverview> {
    const query = days ? `?days=${encodeURIComponent(String(days))}` : "";
    const { body } = await this.http.get<WeightTrendResponse>(`/health/weight${query}`);
    return body;
  }

  async saveWeightEntry(input: SaveWeightEntryInput): Promise<WeightEntry> {
    const { body } = await this.http.put<WeightEntry>("/health/weight", input);
    return body;
  }
}
