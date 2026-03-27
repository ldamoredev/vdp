import { DomainModule } from './common/base/modules/DomainModule';
import { DomainModuleFactory } from './common/base/modules/DomainModuleFactory';
import { DomainModuleDescriptor } from './common/base/modules/DomainModuleDescriptor';
import { ServiceProvider } from './common/base/services/ServiceProvider';
import { HttpController } from './common/http/HttpController';
import { ModuleContext } from './common/base/modules/ModuleContext';
import { EventBus } from './common/base/event-bus/EventBus';
import { AgentRegistry } from './common/base/agents/AgentRegistry';
import { SSEBroadcaster } from './common/base/sse/SSEBroadcaster';
import { RepositoryProvider } from './common/base/db/RepositoryProvider';
import { LLMTraceService } from './common/base/observability/trace/LLMTraceService';
import { TraceService } from './common/base/observability/trace/TraceService';
import { AgentProvider } from './common/base/agents/providers/AgentProvider';
import { EmbeddingProvider } from './common/base/embeddings/EmbeddingProvider';
import { Logger } from './common/base/observability/logging/Logger';

export class Core {
    public readonly logger: Logger;
    public readonly eventBus: EventBus;
    public readonly agentRegistry: AgentRegistry;
    public readonly sseBroadcaster: SSEBroadcaster;
    public readonly services: ServiceProvider = new ServiceProvider();
    private readonly llmTraceService: LLMTraceService;
    private readonly traceService: TraceService;
    private readonly modules: DomainModule[];
    private readonly repositories: RepositoryProvider;
    private readonly moduleContext: ModuleContext;

    constructor(config: CoreConfig) {
        this.logger = config.logger;
        this.eventBus = new EventBus(this.logger);
        this.agentRegistry = new AgentRegistry(this.logger);
        this.sseBroadcaster = new SSEBroadcaster(this.logger);
        this.repositories = config.repositoryProvider;
        this.llmTraceService = config.llmTraceService;
        this.traceService = config.traceService;
        this.moduleContext = this.createModuleContext(config);
        this.modules = this.bootstrapModules(config.moduleFactories);
    }

    private createModuleContext(config: CoreConfig): ModuleContext {
        return {
            repositories: this.repositories,
            services: this.services,
            eventBus: this.eventBus,
            agentRegistry: this.agentRegistry,
            sseBroadcaster: this.sseBroadcaster,
            llmTraceService: this.llmTraceService,
            traceService: this.traceService,
            agentProvider: config.agentProvider,
            embeddingProvider: config.embeddingProvider,
            logger: this.logger,
        };
    }

    private bootstrapModules(moduleFactories: DomainModuleFactory[]): DomainModule[] {
        return moduleFactories.map(createModule => createModule(this.moduleContext).bootstrap());
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
    traceService: TraceService;
    agentProvider: AgentProvider;
    embeddingProvider: EmbeddingProvider;
    moduleFactories: DomainModuleFactory[];
    logger: Logger;
}
