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
}

describe("TasksDashboardProvider", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock("@/CoreProvider");
    vi.unmock("@/TasksEventsProvider");
    delete (globalThis as Record<string, unknown>)[CONTEXT_KEY];
  });

  it(
    "keeps the dashboard store context stable when the module is reloaded",
    async () => {
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
    },
    15_000,
  );
});
