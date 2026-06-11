import { TaskInsightsStore } from './services/TaskInsightsStore';
import { TaskInsightRepository } from './domain/TaskInsightRepository';
import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { TaskModuleRuntime } from './TaskModuleRuntime';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';

export class TaskModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'tasks',
        label: 'Tasks',
    };

    private readonly insightsStore: TaskInsightsStore;
    private readonly runtime: TaskModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.insightsStore = new TaskInsightsStore(
            this.logger,
            context.repositories.get(TaskInsightRepository),
        );
        this.runtime = new TaskModuleRuntime({ ...context, insightsStore: this.insightsStore });
    }

    protected registerServices() {
        this.runtime.registerServices();
    }

    protected registerEventHandlers() {
        this.runtime.registerEventHandlers();
    }

    protected registerAgents() {
        this.runtime.registerAgent();
    }

    async start(): Promise<void> {
        await this.runtime.rehydrateInsights();
        await this.runtime.rehydrateStreaks();
    }

    getControllers(): HttpController[] {
        return this.runtime.createControllers();
    }

    getMiddlewares(): HttpMiddleWare[] {
        return [];
    }

    getDescriptor(): DomainModuleDescriptor {
        return TaskModule.descriptor;
    }
}
