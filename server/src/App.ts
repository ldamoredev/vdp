import Fastify from 'fastify';
import cors from '@fastify/cors';

// Wallet domain routes (old way — to be refactored like tasks)
// Health domain routes (old way — to be refactored like tasks)
// Shared agent route (serves ALL domains via registry)
// Core infrastructure

// Wiring: agents, skills, events, scheduler jobs
import { Core } from './modules/Core';
import { TasksController } from './modules/tasks/infraestructure/routes/TasksController';
import { TaskInsightsSSEController } from './modules/tasks/infraestructure/routes/TaskInsightsSSEController';

export class App {
    public app = Fastify({ logger: true });

    constructor(private core: Core) {
        this.registerControllers();
        this.registerRoutes();
        this.events();
    }

    private async registerRoutes() {
        await this.app.register(cors, { origin: true });

        // ─── Wallet Domain Routes ───────────────────────────────
        //await this.app.register(accountsRoutes);
        //await this.app.register(categoriesRoutes);
        //await this.app.register(transactionsRoutes);
        //await this.app.register(savingsRoutes);
        //await this.app.register(investmentsRoutes);
        //await this.app.register(statsRoutes);
        //await this.app.register(exchangeRatesRoutes);

        // ─── Health Domain Routes ───────────────────────────────
        //await this.app.register(metricsRoutes);
        //await this.app.register(habitsRoutes);
        //await this.app.register(medicationsRoutes);
        //await this.app.register(appointmentsRoutes);
        //await this.app.register(bodyRoutes);

        // ─── Shared Agent Routes (all domains) ─────────────────
        //await this.app.register(agentRoutes);

        this.app.get('/api/health', async () => ({
            status: 'ok',
            timestamp: new Date().toISOString(),
            domains: ['wallet', 'health', 'tasks'],
            agents: this.core.agentRegistry.getAll().map((a) => a.domain),
            skills: this.core.agentRegistry.getAll().flatMap((s) => s.getAllSkills()),
            // scheduler: scheduler.list().map((j) => ({ name: j.name, enabled: j.enabled })),
        }));
    }

    private registerControllers() {
        const tasksController = new TasksController(this.app, this.core);
        this.app.register(tasksController.plugin, { prefix: '/api/v1/tasks' });

        const taskInsightsSSE = new TaskInsightsSSEController(this.core.sseBroadcaster, this.core.taskModule.insightsStore);
        this.app.register(taskInsightsSSE.plugin, { prefix: '/api/v1/tasks/insights' });
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
