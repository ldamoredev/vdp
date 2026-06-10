import { Database } from '../../base/db/Database';
import { RepositoryRegistry } from '../../base/db/RepositoryRegistry';
import { AgentRepository } from '../../base/agents/AgentRepository';
import { DrizzleAgentRepository } from './DrizzleAgentRepository';

export function registerAgentRepositories(registry: RepositoryRegistry, db: Database): void {
    registry.register(AgentRepository, () => new DrizzleAgentRepository(db));
}
