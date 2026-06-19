import { CQBus } from '@nbottarini/cqbus';
import { buildTasksSystemPrompt } from './system-prompt';
import { TasksTools } from './tools.js';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';

export class TaskAgent extends BaseAgent {
    readonly domain: DomainName = 'tasks';
    readonly tools: AgentTool[];

    get systemPrompt(): string {
        return buildTasksSystemPrompt();
    }

    constructor(
        bus: CQBus,
        repositories: RepositoryProvider,
        insightsStore: TaskInsightsStore,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
        authContextStorage: AuthContextStorage,
    ) {
        super(repositories, agentProvider, langfuse, openTelemetry, logger);
        this.tools = TasksTools.createTasksTools(bus, authContextStorage, insightsStore);
    }
}
