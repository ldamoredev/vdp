import type { BaseAgent } from "./base-agent.js";
import type { DomainName } from "../core/event-bus/index.js";

/**
 * Registry of all domain agents.
 * Used by the orchestrator and scheduler to access agents.
 */
class AgentRegistryImpl {
  private agents = new Map<DomainName, BaseAgent>();

  register(agent: BaseAgent): void {
    this.agents.set(agent.domain, agent);
    console.log(`[AGENT REGISTRY] Registered agent: ${agent.domain}`);
  }

  get(domain: DomainName): BaseAgent | undefined {
    return this.agents.get(domain);
  }

  getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  has(domain: DomainName): boolean {
    return this.agents.has(domain);
  }
}

export const agentRegistry = new AgentRegistryImpl();
