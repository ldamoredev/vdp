import { FastifyInstance } from 'fastify';
import { AgentRegistry } from '../base/agents/AgentRegistry';
import { DomainModuleDescriptor } from '../base/modules/DomainModuleDescriptor';
import { HttpController } from './HttpController';
import { buildStatusResponse } from './responses';

export class StatusController implements HttpController {
    constructor(
        private agentRegistry: AgentRegistry,
        private modules: DomainModuleDescriptor[],
    ) {}

    register(app: FastifyInstance): void {
        app.get('/api/health', async () => buildStatusResponse({
            domains: this.modules.map((module) => module.domain),
            agents: this.agentRegistry.getAll().map((agent) => agent.domain),
            skills: this.agentRegistry.getAll().flatMap((agent) => agent.getAllSkills().map((skill) => skill.name)),
        }));
    }
}
