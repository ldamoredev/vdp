import { BaseAgent, type AgentTool } from "../../../agents/base-agent.js";
import type { DomainName } from "../../../core/event-bus/index.js";
import { HEALTH_SYSTEM_PROMPT } from "./system-prompt.js";
import { createHealthTools } from "./tools.js";

export class HealthAgent extends BaseAgent {
  readonly domain: DomainName = "health";
  readonly systemPrompt = HEALTH_SYSTEM_PROMPT;
  readonly tools: AgentTool[] = createHealthTools();
}
