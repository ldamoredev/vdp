import { buildWalletSystemPrompt } from './system-prompt';
import { WalletTools } from './tools.js';
import { CQBus } from '@nbottarini/cqbus';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';

export class WalletAgent extends BaseAgent {
    readonly domain: DomainName = 'wallet';
    readonly tools: AgentTool[];

    get systemPrompt(): string {
        return buildWalletSystemPrompt();
    }

    constructor(
        bus: CQBus,
        repositories: RepositoryProvider,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
        authContextStorage: AuthContextStorage
    ) {
        super(repositories, agentProvider, langfuse, openTelemetry, logger);
        this.tools = WalletTools.createWalletTools(bus, authContextStorage);
    }
}
