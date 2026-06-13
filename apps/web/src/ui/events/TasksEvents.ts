import { observable, type Observable } from "@nbottarini/observable";

/**
 * Cross-module signal for tasks. Fired when something outside a tasks section
 * mutates tasks — today's driver is the agent chat (chat-sync): when the agent
 * runs a task mutation tool, it emits tasksChanged so the dashboard reloads.
 * React-free. During A5 coexistence the legacy chat-sync bridges into this; the
 * bridge is removed when the shell/chat is migrated.
 */
export class TasksEvents {
  private readonly _tasksChanged = observable<void>();

  get tasksChanged(): Observable<void> {
    return this._tasksChanged;
  }

  emitTasksChanged(): Promise<void> {
    return this._tasksChanged.notify();
  }
}
