import { AgentRegistry } from '../agents/AgentRegistry';
import { EventBus } from '../event-bus/EventBus';
import { ServiceProvider } from '../services/ServiceProvider';
import { SSEBroadcaster } from '../sse/SSEBroadcaster';
import { LLMTraceService } from '../observability/trace/LLMTraceService';
import { TraceService } from '../observability/trace/TraceService';
import { RepositoryProvider } from '../db/RepositoryProvider';
import { AgentProvider } from '../agents/providers/AgentProvider';
import { EmbeddingProvider } from '../embeddings/EmbeddingProvider';
import { Logger } from '../observability/logging/Logger';
import { AuthContextStorage } from '../../auth/AuthContextStorage';

export type ModuleContext = {
    repositories: RepositoryProvider;
    services: ServiceProvider;
    eventBus: EventBus;
    agentRegistry: AgentRegistry;
    sseBroadcaster: SSEBroadcaster;
    llmTraceService: LLMTraceService;
    traceService: TraceService;
    agentProvider: AgentProvider;
    embeddingProvider: EmbeddingProvider;
    logger: Logger;
    authContextStorage: AuthContextStorage;
};
