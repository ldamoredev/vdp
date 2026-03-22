import { DomainModule } from './common/base/modules/DomainModule';
import { DomainModuleDescriptor } from './common/base/modules/DomainModuleDescriptor';
import { ServiceProvider } from './common/base/services/ServiceProvider';
import { HttpController } from './common/http/HttpController';
import { ModuleContext } from './common/base/modules/ModuleContext';
import { TaskModule } from './tasks/TaskModule';
import { EventBus } from './common/base/event-bus/EventBus';
import { AgentRegistry } from './common/base/agents/AgentRegistry';
import { SSEBroadcaster } from './common/base/sse/SSEBroadcaster';
import { RepositoryProvider } from './common/base/db/RepositoryProvider';
import { LLMTraceService } from './common/base/observability/trace/LLMTraceService';
import { TraceService } from './common/base/observability/trace/TraceService';
import { AgentProvider } from './common/base/agents/providers/AgentProvider';

export class Core {
    public readonly eventBus: EventBus = new EventBus();
    public readonly agentRegistry = new AgentRegistry();
    public readonly sseBroadcaster = new SSEBroadcaster();
    private readonly llmTraceService: LLMTraceService;
    private readonly traceService: TraceService;
    private readonly taskModule: TaskModule;
    private readonly modules: DomainModule[];
    private repositories: RepositoryProvider;
    private services: ServiceProvider = new ServiceProvider();
    private moduleContext: ModuleContext;

    constructor(config: CoreConfig) {
        this.repositories = config.repositoryProvider;
        this.llmTraceService = config.llmTraceService;
        this.traceService = config.traceService;
        this.moduleContext = {
            repositories: this.repositories,
            services: this.services,
            eventBus: this.eventBus,
            agentRegistry: this.agentRegistry,
            sseBroadcaster: this.sseBroadcaster,
            llmTraceService: this.llmTraceService,
            traceService: this.traceService,
            agentProvider: config.agentProvider
        };
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

    async start() {
        await this.traceService.start();
    }
    async shutdown(): Promise<void> {
        await Promise.allSettled([
            this.llmTraceService.shutdown(),
            this.traceService.shutdown(),
        ]);

    }
}

export interface CoreConfig {
    repositoryProvider: RepositoryProvider;
    llmTraceService: LLMTraceService;
    traceService: TraceService
    agentProvider: AgentProvider
}
