import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const CONTEXT_KEY = "__vdpTasksDashboardContext";

function mockDashboardDependencies() {
  vi.doMock("@/CoreProvider", () => ({ useCore: () => ({}) }));
  vi.doMock("@/TasksEventsProvider", () => ({
    useTasksEvents: () => ({
      tasksChanged: {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      },
    }),
  }));
  vi.doMock("@/lib/format", () => ({ getTodayISO: () => "2026-07-08" }));
  vi.doMock("../TasksDashboardStore", () => ({
    TasksDashboardStore: class {
      start = vi.fn(() => undefined);
    },
  }));
}

describe("TasksDashboardProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock("@/CoreProvider");
    vi.unmock("@/TasksEventsProvider");
    vi.unmock("@/lib/format");
    vi.unmock("../TasksDashboardStore");
    delete (globalThis as Record<string, unknown>)[CONTEXT_KEY];
  });

  it("keeps the dashboard store context stable when the module is reloaded", async () => {
    mockDashboardDependencies();
    const firstModule = await import("../tasks-dashboard-context");

    vi.resetModules();
    mockDashboardDependencies();
    const secondModule = await import("../tasks-dashboard-context");

    function Consumer() {
      secondModule.useTasksDashboardStore();
      return createElement("span", null, "store ok");
    }

    const markup = renderToStaticMarkup(
      createElement(firstModule.TasksDashboardProvider, { children: createElement(Consumer) }),
    );

    expect(markup).toContain("store ok");
  });
});
