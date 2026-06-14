import type { TasksAgentToolName } from "@vdp/shared";

const TASK_MUTATION_TOOLS = [
  "create_task",
  "update_task",
  "delete_task",
  "complete_task",
  "carry_over_task",
  "discard_task",
  "carry_over_all_pending",
] as const satisfies readonly TasksAgentToolName[];

function isTaskMutationTool(tool: string): tool is (typeof TASK_MUTATION_TOOLS)[number] {
  return (TASK_MUTATION_TOOLS as readonly string[]).includes(tool);
}

/**
 * Temporary A5 bridge: while the shell/chat still owns agent streaming, task
 * mutation tool results emit the shared tasksChanged signal so presenter stores
 * reload without depending on React Query cache invalidation.
 */
export function emitTasksChangedForAgentTool(tool: string, emitTasksChanged: () => void): void {
  if (!isTaskMutationTool(tool)) return;
  emitTasksChanged();
}
