import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Core } from "@/core/Core";

describe("app providers", () => {
  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as Record<string, unknown>).__vdpCoreContext;
    delete (globalThis as Record<string, unknown>).__vdpTasksEventsContext;
    delete (globalThis as Record<string, unknown>).__vdpHealthEventsContext;
  });

  it(
    "keeps CoreProvider context stable when the module is reloaded",
    async () => {
      const firstModule = await import("../CoreProvider");

      vi.resetModules();
      const secondModule = await import("../CoreProvider");

      function Consumer() {
        secondModule.useCore();
        return createElement("span", null, "core ok");
      }

      const markup = renderToStaticMarkup(
        createElement(firstModule.CoreProvider, {
          core: {} as Core,
          children: createElement(Consumer),
        }),
      );

      expect(markup).toContain("core ok");
    },
    15_000,
  );

  it(
    "keeps TasksEventsProvider context stable when the module is reloaded",
    async () => {
      const firstModule = await import("../TasksEventsProvider");

      vi.resetModules();
      const secondModule = await import("../TasksEventsProvider");

      function Consumer() {
        secondModule.useTasksEvents();
        return createElement("span", null, "tasks events ok");
      }

      const markup = renderToStaticMarkup(
        createElement(firstModule.TasksEventsProvider, { children: createElement(Consumer) }),
      );

      expect(markup).toContain("tasks events ok");
    },
    15_000,
  );

  it(
    "keeps HealthEventsProvider context stable when the module is reloaded",
    async () => {
      const firstModule = await import("../ui/screens/health/health-events-context");

      vi.resetModules();
      const secondModule = await import("../ui/screens/health/health-events-context");

      function Consumer() {
        secondModule.useHealthEvents();
        return createElement("span", null, "health events ok");
      }

      const markup = renderToStaticMarkup(
        createElement(firstModule.HealthEventsProvider, { children: createElement(Consumer) }),
      );

      expect(markup).toContain("health events ok");
    },
    15_000,
  );
});
