import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { FakeTasksGateway } from "@/core/app/tasks/__tests__/fakes/FakeTasksGateway";
import { TasksEvents } from "@/ui/events/TasksEvents";
import { TasksDashboardStore } from "@/ui/screens/tasks/dashboard/TasksDashboardStore";
import { emitTasksChangedForAgentTool } from "../tasks-chat-sync-bridge";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function build() {
  const gateway = new FakeTasksGateway();
  const core = new Core({ httpClient: {} as never, loggingSink: { debug: vi.fn(), error: vi.fn() } }).use(
    new TasksModule(gateway),
  );
  const events = new TasksEvents();
  const store = new TasksDashboardStore(core, events, "2026-06-14");
  return { events, gateway, store };
}

describe("tasks chat sync bridge", () => {
  it("reloads the dashboard store when an agent task mutation finishes", async () => {
    const { events, gateway, store } = build();
    const unsubscribe = store.start();
    await flush();
    const before = gateway.callsTo("listTasks").length;

    emitTasksChangedForAgentTool("create_task", () => void events.emitTasksChanged());
    await flush();

    expect(gateway.callsTo("listTasks").length).toBe(before + 1);
    unsubscribe();
  });

  it("ignores read-only task tools", () => {
    const emit = vi.fn();

    emitTasksChangedForAgentTool("list_tasks", emit);

    expect(emit).not.toHaveBeenCalled();
  });
});
