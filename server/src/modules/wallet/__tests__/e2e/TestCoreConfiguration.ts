import 'dotenv/config';
import { CoreConfig } from '../../../Core';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { EmbeddingProvider } from '../../../common/base/embeddings/EmbeddingProvider';
import { DomainModuleFactory } from '../../../common/base/modules/DomainModuleFactory';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { Database } from '../../../common/base/db/Database';
import { DrizzleRepositoryProvider } from '../../../common/infrastructure/db/DrizzleRepositoryProvider';
import { OllamaAgentProvider } from '../../../common/base/agents/providers/OllamaAgentProvider';
import { NoOpEmbeddingProvider } from '../../../common/base/embeddings/NoOpEmbeddingProvider';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { WalletModule } from '../../WalletModule';

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
        this.repositoryProvider = new DrizzleRepositoryProvider(new Database(process.env.TEST_DATABASE_URL));
        this.llmTraceService = new NoOpLangfuseLLMTraceService();
        this.traceService = new NoOpOpenTelemetryService();
        this.agentProvider = new OllamaAgentProvider();
        this.embeddingProvider = new NoOpEmbeddingProvider();
        this.authContextStorage = new AuthContextStorage();
        this.moduleFactories = [(context) => new WalletModule(context)];
    }
}
