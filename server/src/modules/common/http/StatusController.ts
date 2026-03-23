import { AgentRegistry } from '../base/agents/AgentRegistry';
import { DomainModuleDescriptor } from '../base/modules/DomainModuleDescriptor';
import { HttpController, RouteRegister } from './HttpController';
import { buildStatusResponse } from './responses';

export class StatusController extends HttpController {
    readonly prefix = '/api';

    constructor(
        private agentRegistry: AgentRegistry,
        private modules: DomainModuleDescriptor[],
    ) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes.get('/health', this.health);
    }

    private readonly health = async () => buildStatusResponse({
        domains: this.modules.map((module) => module.domain),
        agents: this.agentRegistry.getAll().map((agent) => agent.domain),
        skills: this.agentRegistry.getAll().flatMap((agent) => agent.getAllSkills().map((skill) => skill.name)),
    });
}
