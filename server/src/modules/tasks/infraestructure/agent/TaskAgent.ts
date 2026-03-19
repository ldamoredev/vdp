import { TASKS_SYSTEM_PROMPT } from './system-prompt';
import { TasksTools } from './tools';
import { DomainName } from '../../../common/base/event-bus/DomainEvent';
import { AgentTool, BaseAgent } from '../../../common/base/agents/BaseAgent';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { DrizzleRepositoryProvider } from '../../../common/infrastructure/db/DrizzleRepositoryProvider';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';

export class TaskAgent extends BaseAgent {
    readonly domain: DomainName = 'tasks';
    readonly systemPrompt = TASKS_SYSTEM_PROMPT;
    readonly tools: AgentTool[];

    constructor(
        eventBus: EventBus,
        services: ServiceProvider,
        repositories: DrizzleRepositoryProvider,
        insightsStore: TaskInsightsStore,
    ) {
        super(eventBus, services, repositories);
        this.tools = TasksTools.createTasksTools(services, insightsStore);
    }
}
