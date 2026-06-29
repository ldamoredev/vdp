import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type { Objective as ObjectiveDto } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Objective } from "../../../domain/objectives/Objective";
import { HttpObjectivesGateway } from "../HttpObjectivesGateway";

interface RecordedCall {
  method: HttpMethods;
  url: string;
  body: unknown;
}

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

function objectiveDto(overrides: Partial<ObjectiveDto> = {}): ObjectiveDto {
  return {
    id: "o1",
    title: "120 horas",
    periodStart: "2026-07-01",
    periodEnd: "2026-09-30",
    metricSource: "projects_hours",
    target: 120,
    unit: "h",
    manualValue: null,
    status: "active",
    archivedAt: null,
    achievedAt: null,
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:00:00.000Z",
    ...overrides,
  };
}

describe("HttpObjectivesGateway", () => {
  it("lists objectives and maps DTOs to domain models", async () => {
    const http = new FakeHttpClient({ "GET /objectives": { objectives: [objectiveDto()] } });

    const objectives = await new HttpObjectivesGateway(http).listObjectives();

    expect(objectives[0]).toBeInstanceOf(Objective);
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/objectives" });
  });

  it("creates and updates objectives with the expected body", async () => {
    const http = new FakeHttpClient({
      "POST /objectives": objectiveDto({ id: "created", metricSource: "manual", manualValue: 2 }),
      "PUT /objectives/o1": objectiveDto({ manualValue: 5 }),
    });
    const gateway = new HttpObjectivesGateway(http);

    const created = await gateway.createObjective({
      title: "Leer 12 libros",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      metricSource: "manual",
      target: 12,
      unit: "libros",
      manualValue: 2,
    });
    const updated = await gateway.updateObjective("o1", { manualValue: 5 });

    expect(created.id).toBe("created");
    expect(updated.manualValue).toBe(5);
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/objectives" });
    expect(http.calls[1]).toMatchObject({ method: "PUT", url: "/objectives/o1", body: { manualValue: 5 } });
  });

  it("marks an objective achieved and archives an objective", async () => {
    const http = new FakeHttpClient({
      "POST /objectives/o1/achieve": objectiveDto({ status: "achieved", achievedAt: "2026-06-28T12:00:00.000Z" }),
      "POST /objectives/o1/archive": objectiveDto({ status: "archived", archivedAt: "2026-06-28T12:00:00.000Z" }),
    });

    const gateway = new HttpObjectivesGateway(http);
    const achieved = await gateway.markObjectiveAchieved("o1");
    const objective = await gateway.archiveObjective("o1");

    expect(achieved.status).toBe("achieved");
    expect(objective.status).toBe("archived");
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/objectives/o1/achieve", body: {} });
    expect(http.calls[1]).toMatchObject({ method: "POST", url: "/objectives/o1/archive", body: {} });
  });
});
