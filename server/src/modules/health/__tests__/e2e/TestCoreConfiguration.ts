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
import { createDefaultRepositoryRegistry } from '../../../DefaultRepositories';
import { OllamaAgentProvider } from '../../../common/base/agents/providers/OllamaAgentProvider';
import { NoOpEmbeddingProvider } from '../../../common/base/embeddings/NoOpEmbeddingProvider';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { HealthModule } from '../../HealthModule';
import { TaskModule } from '../../../tasks/TaskModule';
import { TEST_DATABASE_CONNECTION_STRING } from '../../../../test/test-database';

/**
 * Boots Health together with Tasks so the cross-domain flow
 * (habit events -> task insights/tasks) runs end to end.
 */
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
        this.repositoryProvider = createDefaultRepositoryRegistry(new Database(TEST_DATABASE_CONNECTION_STRING));
        this.llmTraceService = new NoOpLangfuseLLMTraceService();
        this.traceService = new NoOpOpenTelemetryService();
        this.agentProvider = new OllamaAgentProvider();
        this.embeddingProvider = new NoOpEmbeddingProvider();
        this.authContextStorage = new AuthContextStorage();
        this.moduleFactories = [
            (context) => new HealthModule(context),
            (context) => new TaskModule(context),
        ];
    }
}
