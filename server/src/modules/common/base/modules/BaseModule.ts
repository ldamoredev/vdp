import { AgentRegistry } from '../agents/AgentRegistry';
import { EventBus } from '../event-bus/EventBus';
import { EventSubscriber } from '../event-bus/EventSubscriber';
import { ServiceProvider } from '../services/ServiceProvider';
import { SSEBroadcaster } from '../sse/SSEBroadcaster';
import { LLMTraceService } from '../observability/trace/LLMTraceService';
import { TraceService } from '../observability/trace/TraceService';
import { ModuleContext } from './ModuleContext';
import { DomainModule } from './DomainModule';
import { DomainModuleDescriptor } from './DomainModuleDescriptor';
import { HttpController } from '../../http/HttpController';
import { RepositoryProvider } from '../db/RepositoryProvider';
import { AgentProvider } from '../agents/providers/AgentProvider';
import { EmbeddingProvider } from '../embeddings/EmbeddingProvider';
import { Logger } from '../observability/logging/Logger';

export abstract class BaseModule implements DomainModule {
    protected readonly repositories: RepositoryProvider;
    protected readonly services: ServiceProvider;
    protected readonly eventBus: EventBus;
    protected readonly agentRegistry: AgentRegistry;
    protected readonly sseBroadcaster: SSEBroadcaster;
    protected readonly llmTraceService: LLMTraceService;
    protected readonly traceService: TraceService;
    protected readonly agentProvider: AgentProvider;
    protected readonly embeddingProvider: EmbeddingProvider;
    protected readonly logger: Logger;

    constructor(context: ModuleContext) {
        this.repositories = context.repositories;
        this.services = context.services;
        this.eventBus = context.eventBus;
        this.agentRegistry = context.agentRegistry;
        this.sseBroadcaster = context.sseBroadcaster;
        this.llmTraceService = context.llmTraceService;
        this.traceService = context.traceService;
        this.agentProvider = context.agentProvider;
        this.embeddingProvider = context.embeddingProvider;
        this.logger = context.logger;
    }

    bootstrap(): this {
        this.registerServices();
        this.registerEventHandlers();
        this.registerAgents();
        return this;
    }

    protected abstract registerServices(): void;

    protected abstract registerEventHandlers(): void;

    protected abstract registerAgents(): void;

    protected registerSubscribers(...subscribers: EventSubscriber[]): void {
        for (const subscriber of subscribers) {
            subscriber.subscribe();
        }
    }

    abstract getControllers(): HttpController[];

    abstract getDescriptor(): DomainModuleDescriptor;
}
