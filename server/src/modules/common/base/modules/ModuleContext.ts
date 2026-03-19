import { AgentRegistry } from '../agents/AgentRegistry';
import { EventBus } from '../event-bus/EventBus';
import { ServiceProvider } from '../services/ServiceProvider';
import { SSEBroadcaster } from '../sse/SSEBroadcaster';
import { DrizzleRepositoryProvider } from '../../infrastructure/db/DrizzleRepositoryProvider';

export type ModuleContext = {
    repositories: DrizzleRepositoryProvider;
    services: ServiceProvider;
    eventBus: EventBus;
    agentRegistry: AgentRegistry;
    sseBroadcaster: SSEBroadcaster;
};
