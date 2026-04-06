import 'dotenv/config';
import {
    NoOpLangfuseLLMTraceService,
} from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import {
    NoOpOpenTelemetryService,
} from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { CoreConfig } from '../../../Core';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { DrizzleRepositoryProvider } from '../../../common/infrastructure/db/DrizzleRepositoryProvider';
import { Database } from '../../../common/base/db/Database';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { OllamaAgentProvider } from '../../../common/base/agents/providers/OllamaAgentProvider';
import { EmbeddingProvider } from '../../../common/base/embeddings/EmbeddingProvider';
import { NoOpEmbeddingProvider } from '../../../common/base/embeddings/NoOpEmbeddingProvider';
import { DomainModuleFactory } from '../../../common/base/modules/DomainModuleFactory';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { TaskModule } from '../../TaskModule';
import { TEST_DATABASE_CONNECTION_STRING } from '../integration/test-database';

export class TestCoreConfiguration implements CoreConfig {
    repositoryProvider: RepositoryProvider;
    llmTraceService: LLMTraceService;
    traceService: TraceService;
    agentProvider: AgentProvider;
    embeddingProvider: EmbeddingProvider;
    moduleFactories: DomainModuleFactory[];
    logger: Logger;
    authContextStorage: AuthContextStorage;

    constructor() {
        this.logger = new NoOpLogger();
        this.repositoryProvider = new DrizzleRepositoryProvider(new Database(TEST_DATABASE_CONNECTION_STRING));
        this.llmTraceService = new NoOpLangfuseLLMTraceService();
        this.traceService = new NoOpOpenTelemetryService();
        this.agentProvider = new OllamaAgentProvider();
        this.embeddingProvider = new NoOpEmbeddingProvider();
        this.authContextStorage = new AuthContextStorage();
        this.moduleFactories = [(context) => new TaskModule(context)];
    }
}
