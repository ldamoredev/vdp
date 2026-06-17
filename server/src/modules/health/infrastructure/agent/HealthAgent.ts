import { buildHealthSystemPrompt } from './system-prompt';
import { HealthTools } from './tools';
import { CQBus } from '@nbottarini/cqbus';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';

export class HealthAgent extends BaseAgent {
    readonly domain: DomainName = 'health';
    readonly tools: AgentTool[];

    get systemPrompt(): string {
        return buildHealthSystemPrompt();
    }

    constructor(
        eventBus: EventBus,
        services: ServiceProvider,
        bus: CQBus,
        repositories: RepositoryProvider,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
        authContextStorage: AuthContextStorage,
    ) {
        super(eventBus, services, repositories, agentProvider, langfuse, openTelemetry, logger);
        this.tools = HealthTools.createHealthTools(bus, authContextStorage);
    }
}
