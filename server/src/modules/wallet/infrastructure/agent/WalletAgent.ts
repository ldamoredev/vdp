import { WALLET_SYSTEM_PROMPT } from './system-prompt';
import { WalletTools } from './tools';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { Logger } from '../../../common/base/observability/logging/Logger';

export class WalletAgent extends BaseAgent {
    readonly domain: DomainName = 'wallet';
    readonly systemPrompt = WALLET_SYSTEM_PROMPT;
    readonly tools: AgentTool[];

    constructor(
        eventBus: EventBus,
        services: ServiceProvider,
        repositories: RepositoryProvider,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
    ) {
        super(eventBus, services, repositories, agentProvider, langfuse, openTelemetry, logger);
        this.tools = WalletTools.createWalletTools(services);
    }
}
