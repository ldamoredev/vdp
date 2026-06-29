import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type {
  GoalOverview,
  GoalsOverviewResponse,
  HabitCompletionsResponse,
  HabitsOverviewResponse,
  MoodCheckInsResponse,
  WeightTrendResponse,
} from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Goal } from "../../../domain/health/Goal";
import { HttpHealthGateway } from "../HttpHealthGateway";

interface RecordedCall {
  method: HttpMethods;
  url: string;
  body: unknown;
}

/**
 * Minimal HttpClient double: records each call and returns a canned body per
 * "METHOD url" key. Only get/post are exercised by the gateway.
 */
class FakeHttpClient implements HttpClient {
  readonly calls: RecordedCall[] = [];
  constructor(private readonly responses: Record<string, unknown> = {}) {}

  get<T = any>(url: string) {
    return this.record<T>(HttpMethods.GET, url, undefined);
  }
  post<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.POST, url, body);
  }
  put<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PUT, url, body);
  }
  patch<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PATCH, url, body);
  }
  delete<T = any>(url: string) {
    return this.record<T>(HttpMethods.DELETE, url, undefined);
  }
  head<T = any>(url: string) {
    return this.record<T>(HttpMethods.HEAD, url, undefined);
  }
  send<T = any>(request: HttpRequest) {
    return this.record<T>(request.method, request.url, request.body);
  }
  addInterceptor() {}

  private async record<T>(method: HttpMethods, url: string, body: unknown): Promise<HttpResponse<T>> {
    this.calls.push({ method, url, body });
    return {
      method,
      url,
      status: 200,
      statusText: "OK",
      headers: {},
      body: (this.responses[`${method} ${url}`] ?? {}) as T,
      request: new HttpRequest(method, url, body),
    };
  }
}

function goalDto(overrides: Partial<GoalOverview> = {}): GoalOverview {
  return {
    id: "g1",
    title: "Gym",
    notes: null,
    targetDate: "2026-07-01",
    targetWeightKg: null,
    status: "active",
    completedAt: null,
    daysLeft: 10,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("HttpHealthGateway", () => {
  it("lists habits and passes the overview and date through", async () => {
    const body: HabitsOverviewResponse = {
      habits: [{ id: "h1" } as HabitsOverviewResponse["habits"][number]],
      date: "2026-06-13",
    };
    const http = new FakeHttpClient({ "GET /health/habits": body });

    const result = await new HttpHealthGateway(http).listHabits();

    expect(result.date).toBe("2026-06-13");
    expect(result.habits[0].id).toBe("h1");
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/health/habits" });
  });

  it("gets habit completions for a date range", async () => {
    const body: HabitCompletionsResponse = {
      habitId: "h1",
      from: "2026-06-01",
      to: "2026-06-30",
      count: 6,
    };
    const http = new FakeHttpClient({
      "GET /health/habits/h1/completions?from=2026-06-01&to=2026-06-30": body,
    });

    const result = await new HttpHealthGateway(http).getHabitCompletions({
      habitId: "h1",
      from: "2026-06-01",
      to: "2026-06-30",
    });

    expect(result).toEqual(body);
    expect(http.calls[0]).toMatchObject({
      method: "GET",
      url: "/health/habits/h1/completions?from=2026-06-01&to=2026-06-30",
    });
  });

  it("maps goal DTOs into rich Goal models on list", async () => {
    const body: GoalsOverviewResponse = { goals: [goalDto({ daysLeft: -2 })], date: "2026-06-13" };
    const http = new FakeHttpClient({ "GET /health/goals": body });

    const result = await new HttpHealthGateway(http).listGoals();

    expect(result.goals[0]).toBeInstanceOf(Goal);
    expect(result.goals[0].isOverdue).toBe(true);
  });

  it("posts the create-habit body", async () => {
    const http = new FakeHttpClient();
    await new HttpHealthGateway(http).createHabit({ name: "Leer" });
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/health/habits", body: { name: "Leer" } });
  });

  it("sends a date only when given for complete/relapse", async () => {
    const http = new FakeHttpClient();
    const gateway = new HttpHealthGateway(http);

    await gateway.completeHabit("h1");
    await gateway.completeHabit("h2", "2026-06-10");
    await gateway.relapseCounter("c1", "2026-06-09");

    expect(http.calls[0]).toMatchObject({ url: "/health/habits/h1/complete", body: {} });
    expect(http.calls[1]).toMatchObject({ url: "/health/habits/h2/complete", body: { date: "2026-06-10" } });
    expect(http.calls[2]).toMatchObject({ url: "/health/counters/c1/relapse", body: { date: "2026-06-09" } });
  });

  it("returns the completed Goal so the graduation flow can use it", async () => {
    const http = new FakeHttpClient({
      "POST /health/goals/g1/complete": goalDto({ id: "g1", title: "Gym", status: "done" }),
    });

    const goal = await new HttpHealthGateway(http).completeGoal("g1");

    expect(goal).toBeInstanceOf(Goal);
    expect(goal.id).toBe("g1");
    expect(goal.title).toBe("Gym");
  });

  it("posts the graduate body to the right goal", async () => {
    const http = new FakeHttpClient();
    await new HttpHealthGateway(http).graduateGoal("g1", { habitName: "Gimnasio" });
    expect(http.calls[0]).toMatchObject({
      method: "POST",
      url: "/health/goals/g1/graduate",
      body: { habitName: "Gimnasio" },
    });
  });

  it("lists and saves mood check-ins through the upsert endpoint", async () => {
    const body: MoodCheckInsResponse = {
      checkIns: [],
      date: "2026-06-13",
      summary: {
        days: 7,
        checkInCount: 0,
        averageMood: null,
        averageEnergy: null,
        habitCompletionRate: 0,
      },
    };
    const http = new FakeHttpClient({
      "GET /health/mood-check-ins?days=7": body,
      "PUT /health/mood-check-ins": {
        id: "m1",
        date: "2026-06-13",
        mood: 2,
        energy: 4,
        createdAt: "2026-06-13T00:00:00.000Z",
        updatedAt: "2026-06-13T00:00:00.000Z",
      },
    });
    const gateway = new HttpHealthGateway(http);

    await gateway.listMoodCheckIns(7);
    const saved = await gateway.saveMoodCheckIn({ mood: 2, energy: 4 });

    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/health/mood-check-ins?days=7" });
    expect(http.calls[1]).toMatchObject({
      method: "PUT",
      url: "/health/mood-check-ins",
      body: { mood: 2, energy: 4 },
    });
    expect(saved.mood).toBe(2);
  });

  it("lists and saves weight entries through the trend endpoint", async () => {
    const body: WeightTrendResponse = {
      entries: [],
      date: "2026-06-13",
      summary: {
        days: 30,
        entryCount: 0,
        currentWeightKg: null,
        previousWeightKg: null,
        changeKg: null,
        direction: "flat",
      },
    };
    const http = new FakeHttpClient({
      "GET /health/weight?days=30": body,
      "PUT /health/weight": {
        id: "w1",
        date: "2026-06-13",
        weightKg: "82.10",
        createdAt: "2026-06-13T00:00:00.000Z",
        updatedAt: "2026-06-13T00:00:00.000Z",
      },
    });
    const gateway = new HttpHealthGateway(http);

    await gateway.getWeightTrend(30);
    const saved = await gateway.saveWeightEntry({ weightKg: "82.10" });

    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/health/weight?days=30" });
    expect(http.calls[1]).toMatchObject({
      method: "PUT",
      url: "/health/weight",
      body: { weightKg: "82.10" },
    });
    expect(saved.weightKg).toBe("82.10");
  });
});
