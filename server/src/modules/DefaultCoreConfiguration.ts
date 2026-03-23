import 'dotenv/config';
import { RepositoryProvider } from './common/base/db/RepositoryProvider';
import { LLMTraceService } from './common/base/observability/trace/LLMTraceService';
import { TraceService } from './common/base/observability/trace/TraceService';
import { CoreConfig } from './Core';
import { Database } from './common/base/db/Database';
import { DrizzleRepositoryProvider } from './common/infrastructure/db/DrizzleRepositoryProvider';
import { createLangfuseService } from './common/infrastructure/observability/trace/langfuse/LangfuseLLMTraceService';
import {
    createOpenTelemetryService
} from './common/infrastructure/observability/trace/opentelemetry/OpenTelemetryService';
import { AgentProvider } from './common/base/agents/providers/AgentProvider';
import { createAgentProvider } from './common/base/agents/providers/createAgentProvider';
import { EmbeddingProvider } from './common/base/embeddings/EmbeddingProvider';
import { createEmbeddingProvider } from './common/infrastructure/embeddings/createEmbeddingProvider';
import { DomainModuleFactory } from './common/base/modules/DomainModuleFactory';
import { TaskModule } from './tasks/TaskModule';
import { Logger } from './common/base/observability/logging/Logger';
import { ConsoleLogger } from './common/infrastructure/observability/logging/ConsoleLogger';

export class DefaultCoreConfiguration implements CoreConfig {
    repositoryProvider: RepositoryProvider;
    llmTraceService: LLMTraceService;
    traceService: TraceService;
    agentProvider: AgentProvider;
    embeddingProvider: EmbeddingProvider;
    moduleFactories: DomainModuleFactory[];
    logger: Logger;

    constructor() {
        this.logger = new ConsoleLogger();
        this.repositoryProvider = new DrizzleRepositoryProvider(new Database());
        this.llmTraceService = createLangfuseService(process.env, this.logger);
        this.traceService = createOpenTelemetryService(process.env, this.logger);
        this.agentProvider = createAgentProvider(process.env);
        this.embeddingProvider = createEmbeddingProvider(process.env);
        this.moduleFactories = [(context) => new TaskModule(context)];
    }
}
