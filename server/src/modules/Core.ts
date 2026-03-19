import { Database } from './common/base/db/Database';
import { SConstructor, ServiceProvider } from './common/base/services/ServiceProvider';
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
        this.taskModule = this.initModules();
    }

    private initModules(): TaskModule {
        return new TaskModule(this.moduleContext).bootstrap();
    }

    getService<T>(service: SConstructor<T>): T {
        return this.services.get(service);
    }
}
