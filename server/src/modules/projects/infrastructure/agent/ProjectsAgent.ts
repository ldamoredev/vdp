import { CQBus } from '@nbottarini/cqbus';

import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { buildProjectsSystemPrompt } from './system-prompt';
import { ProjectsTools } from './tools';

export class ProjectsAgent extends BaseAgent {
    readonly domain: DomainName = 'projects';
    readonly tools: AgentTool[];

    get systemPrompt(): string {
        return buildProjectsSystemPrompt();
    }

    constructor(
        bus: CQBus,
        repositories: RepositoryProvider,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
        authContextStorage: AuthContextStorage,
    ) {
        super(repositories, agentProvider, langfuse, openTelemetry, logger);
        this.tools = ProjectsTools.createProjectsTools(bus, authContextStorage);
    }
}
