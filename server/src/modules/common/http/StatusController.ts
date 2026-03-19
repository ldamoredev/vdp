import { FastifyInstance } from 'fastify';
import { Core } from '../../Core';
import { HttpController } from './HttpController';

export class StatusController implements HttpController {
    constructor(private core: Core) {}

    register(app: FastifyInstance): void {
        app.get('/api/health', async () => ({
            status: 'ok',
            timestamp: new Date().toISOString(),
            domains: ['tasks'],
            agents: this.core.agentRegistry.getAll().map((agent) => agent.domain),
            skills: this.core.agentRegistry.getAll().flatMap((agent) => agent.getAllSkills()),
        }));
    }
}
