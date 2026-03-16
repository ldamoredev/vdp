import { BaseAgent, type AgentTool } from "../../../agents/base-agent.js";
import type { DomainName } from "../../../core/event-bus/index.js";
import { TASKS_SYSTEM_PROMPT } from "./system-prompt.js";
import { createTasksTools } from "./tools.js";

export class TasksAgent extends BaseAgent {
  readonly domain: DomainName = "tasks";
  readonly systemPrompt = TASKS_SYSTEM_PROMPT;
  readonly tools: AgentTool[] = createTasksTools();
}
