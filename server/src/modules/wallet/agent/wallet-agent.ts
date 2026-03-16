import { BaseAgent, type AgentTool } from "../../../agents/base-agent.js";
import type { DomainName } from "../../../core/event-bus/index.js";
import { WALLET_SYSTEM_PROMPT } from "./system-prompt.js";
import { createWalletTools } from "./tools.js";

export class WalletAgent extends BaseAgent {
  readonly domain: DomainName = "wallet";
  readonly systemPrompt = WALLET_SYSTEM_PROMPT;
  readonly tools: AgentTool[] = createWalletTools();
}
