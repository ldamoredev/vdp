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

export class TestCoreConfiguration implements CoreConfig {
    repositoryProvider: RepositoryProvider;
    llmTraceService: LLMTraceService;
    traceService: TraceService;
    agentProvider: AgentProvider;

    constructor() {
        this.repositoryProvider = new DrizzleRepositoryProvider(new Database());
        this.llmTraceService = new NoOpLangfuseLLMTraceService();
        this.traceService = new NoOpOpenTelemetryService()
        this.agentProvider = new OllamaAgentProvider();
    }

}