import Fastify from 'fastify';
import cors from '@fastify/cors';

// Wallet domain routes (old way — to be refactored like tasks)
// Health domain routes (old way — to be refactored like tasks)
// Shared agent route (serves ALL domains via registry)
// Core infrastructure

// Wiring: agents, skills, events, scheduler jobs
import { Core } from './modules/Core';
import { TasksController } from './modules/tasks/infraestructure/routes/TasksController';
import { TasksAgentController } from './modules/tasks/infraestructure/routes/TasksAgentController';
import { TaskInsightsSSEController } from './modules/tasks/infraestructure/routes/TaskInsightsSSEController';

export class App {
    public app = Fastify({ logger: true });

    constructor(private core: Core) {
        this.registerPlugins();
        this.registerControllers();
        this.registerRoutes();
        this.events();
    }

    private registerPlugins() {
        this.app.register(cors, { origin: true });
    }

    private registerControllers() {
        const tasksController = new TasksController(this.app, this.core);
        this.app.register(tasksController.plugin, { prefix: '/api/v1/tasks' });

        const tasksAgentController = new TasksAgentController(this.core);
        this.app.register(tasksAgentController.plugin, { prefix: '/api/v1/tasks/agent' });

        const taskInsightsSSE = new TaskInsightsSSEController(this.core.sseBroadcaster, this.core.taskModule.insightsStore);
        this.app.register(taskInsightsSSE.plugin, { prefix: '/api/v1/tasks/insights' });
    }

    private registerRoutes() {
        this.app.get('/api/health', async () => ({
            status: 'ok',
            timestamp: new Date().toISOString(),
            domains: ['tasks'],
            agents: this.core.agentRegistry.getAll().map((a) => a.domain),
            skills: this.core.agentRegistry.getAll().flatMap((s) => s.getAllSkills()),
        }));
    }

    private events() {
        this.core.eventBus.onAll((event) => {
            console.log(`[TIMELINE] ${event.domain}.${event.type} at ${event.timestamp.toISOString()}`);
        });
    }

    async listen(param: { port: number; host: string }) {
        await this.app.listen(param);
    }
}
