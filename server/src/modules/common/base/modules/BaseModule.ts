import { AgentRegistry } from '../agents/AgentRegistry';
import { EventBus } from '../event-bus/EventBus';
import { ServiceProvider } from '../services/ServiceProvider';
import { SSEBroadcaster } from '../sse/SSEBroadcaster';
import { DrizzleRepositoryProvider } from '../../infrastructure/db/DrizzleRepositoryProvider';
import { ModuleContext } from './ModuleContext';

export abstract class BaseModule {
    protected readonly repositories: DrizzleRepositoryProvider;
    protected readonly services: ServiceProvider;
    protected readonly eventBus: EventBus;
    protected readonly agentRegistry: AgentRegistry;
    protected readonly sseBroadcaster: SSEBroadcaster;

    constructor(context: ModuleContext) {
        this.repositories = context.repositories;
        this.services = context.services;
        this.eventBus = context.eventBus;
        this.agentRegistry = context.agentRegistry;
        this.sseBroadcaster = context.sseBroadcaster;
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
}
