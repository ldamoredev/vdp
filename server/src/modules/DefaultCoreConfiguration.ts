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

export class DefaultCoreConfiguration implements CoreConfig {
    repositoryProvider: RepositoryProvider;
    llmTraceService: LLMTraceService;
    traceService: TraceService;
    agentProvider: AgentProvider;

    constructor() {
        this.repositoryProvider = new DrizzleRepositoryProvider(new Database());
        this.llmTraceService = createLangfuseService(process.env);
        this.traceService = createOpenTelemetryService(process.env);
        this.agentProvider = createAgentProvider(process.env);
    }
}