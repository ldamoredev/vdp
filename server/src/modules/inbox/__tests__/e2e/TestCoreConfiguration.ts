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
import { createDefaultRepositoryRegistry } from '../../../DefaultRepositories';
import { Database } from '../../../common/base/db/Database';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { AgentProviderResponse } from '../../../common/base/agents/providers/types';
import { EmbeddingProvider } from '../../../common/base/embeddings/EmbeddingProvider';
import { NoOpEmbeddingProvider } from '../../../common/base/embeddings/NoOpEmbeddingProvider';
import { DomainModuleFactory } from '../../../common/base/modules/DomainModuleFactory';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { TEST_DATABASE_CONNECTION_STRING } from '../../../../test/test-database';
import { InboxModule } from '../../InboxModule';

/** Deterministic stand-in: e2e coverage exercises the route/idempotency, not real classification. */
class DeterministicAgentProvider implements AgentProvider {
    readonly name = 'deterministic-test';
    readonly defaultModel = 'deterministic-test-model';

    async generate(): Promise<AgentProviderResponse> {
        return { text: 'wallet', toolCalls: [], stopReason: 'end_turn' };
    }
}

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
        this.agentProvider = new DeterministicAgentProvider();
        this.embeddingProvider = new NoOpEmbeddingProvider();
        this.authContextStorage = new AuthContextStorage();
        this.moduleFactories = [
            (context) => new InboxModule(context),
        ];
    }
}
