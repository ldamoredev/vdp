import type { BaseAgent } from './BaseAgent';
import { DomainName } from '../event-bus/DomainEvent';
import { Logger } from '../observability/logging/Logger';
import { NoOpLogger } from '../../infrastructure/observability/logging/NoOpLogger';

/**
 * Registry of all domain agents.
 * Used by the orchestrator and scheduler to access agents.
 */
export class AgentRegistry {
  constructor(private readonly logger: Logger = new NoOpLogger()) {}

  private agents = new Map<DomainName, BaseAgent>();

  register(agent: BaseAgent): void {
    this.agents.set(agent.domain, agent);
    this.logger.info('agent registered', { domain: agent.domain });
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
