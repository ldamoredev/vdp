import { Database } from './common/base/db/Database';
import { DomainModule } from './common/base/modules/DomainModule';
import { DomainModuleDescriptor } from './common/base/modules/DomainModuleDescriptor';
import { ServiceProvider } from './common/base/services/ServiceProvider';
import { HttpController } from './common/http/HttpController';
import { ModuleContext } from './common/base/modules/ModuleContext';
import { TaskModule } from './tasks/TaskModule';
import { DrizzleRepositoryProvider } from './common/infrastructure/db/DrizzleRepositoryProvider';
import { EventBus } from './common/base/event-bus/EventBus';
import { AgentRegistry } from './common/base/agents/AgentRegistry';
import { SSEBroadcaster } from './common/base/sse/SSEBroadcaster';

export class Core {
    public readonly eventBus: EventBus = new EventBus();
    public readonly database = new Database();
    public readonly agentRegistry = new AgentRegistry();
    public readonly sseBroadcaster = new SSEBroadcaster();
    public readonly taskModule: TaskModule;
    private readonly modules: DomainModule[];
    private repositories: DrizzleRepositoryProvider = new DrizzleRepositoryProvider(this.database);
    private services: ServiceProvider = new ServiceProvider();
    private moduleContext: ModuleContext = {
        repositories: this.repositories,
        services: this.services,
        eventBus: this.eventBus,
        agentRegistry: this.agentRegistry,
        sseBroadcaster: this.sseBroadcaster,
    };

    constructor() {
        this.taskModule = this.initTaskModule();
        this.modules = [this.taskModule];
    }

    private initTaskModule(): TaskModule {
        return new TaskModule(this.moduleContext).bootstrap();
    }

    getRepository<T>(token: abstract new (...args: any[]) => T): T {
        return this.repositories.get(token);
    }

    getControllers(): HttpController[] {
        return this.modules.flatMap((module) => module.getControllers());
    }

    getModuleDescriptors(): DomainModuleDescriptor[] {
        return this.modules.map((module) => module.getDescriptor());
    }
}
