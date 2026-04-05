import { TASKS_SYSTEM_PROMPT } from './system-prompt';
import { TasksTools } from './tools.js';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { LLMTraceService } from '../../../common/base/observability/trace/LLMTraceService';
import { TraceService } from '../../../common/base/observability/trace/TraceService';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { Logger } from '../../../common/base/observability/logging/Logger';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';

export class TaskAgent extends BaseAgent {
    readonly domain: DomainName = 'tasks';
    readonly systemPrompt = TASKS_SYSTEM_PROMPT;
    readonly tools: AgentTool[];

    constructor(
        eventBus: EventBus,
        services: ServiceProvider,
        repositories: RepositoryProvider,
        insightsStore: TaskInsightsStore,
        langfuse: LLMTraceService,
        openTelemetry: TraceService,
        agentProvider: AgentProvider,
        logger: Logger,
        authContextStorage: AuthContextStorage,
    ) {
        super(eventBus, services, repositories, agentProvider, langfuse, openTelemetry, logger);
        this.tools = TasksTools.createTasksTools(services, authContextStorage, insightsStore);
    }
}
