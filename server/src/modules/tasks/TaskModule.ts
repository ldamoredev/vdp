import { ServiceProvider } from '../common/base/services/ServiceProvider';
import { TaskRepository } from './domain/TaskRepository';
import { TaskNoteRepository } from './domain/TaskNoteRepository';

// Services
import { GetTasks } from './services/GetTasks';
import { GetTask } from './services/GetTask';
import { CreateTask } from './services/CreateTask';
import { UpdateTask } from './services/UpdateTask';
import { DeleteTask } from './services/DeleteTask';
import { CompleteTask } from './services/CompleteTask';
import { CarryOverTask } from './services/CarryOverTask';
import { DiscardTask } from './services/DiscardTask';
import { CarryOverAllPending } from './services/CarryOverAllPending';
import { GetEndOfDayReview } from './services/GetEndOfDayReview';
import { AddTaskNote } from './services/AddTaskNote';
import { GetDayStats } from './services/GetDayStats';
import { GetCompletionByDomain } from './services/GetCompletionByDomain';
import { GetCarryOverRate } from './services/GetCarryOverRate';
import { CheckTasksOverload } from './services/CheckTasksOverload';
import { CheckDailyCompletion } from './services/CheckDailyCompletion';
import { TaskEventHandlers } from './services/TaskEventHandlers';
import { TaskInsightsStore } from './services/TaskInsightsStore';
import { DrizzleRepositoryProvider } from '../common/infrastructure/db/DrizzleRepositoryProvider';
import { EventBus } from '../common/base/event-bus/EventBus';
import { AgentRegistry } from '../common/base/agents/AgentRegistry';
import { TaskAgent } from './infraestructure/agent/TaskAgent';
import { SSEBroadcaster } from '../common/base/sse/SSEBroadcaster';

export class TaskModule {
    readonly insightsStore = new TaskInsightsStore();

    constructor(
        private repositories: DrizzleRepositoryProvider,
        private services: ServiceProvider,
        private eventBus: EventBus,
        private agentRegistry: AgentRegistry,
        private sseBroadcaster: SSEBroadcaster,
    ) {
        this.registerServices();
        this.registerSubscribers();
        this.registerAgents();
    }

    private registerServices() {
        const taskRepo = () => this.repositories.get(TaskRepository);
        const noteRepo = () => this.repositories.get(TaskNoteRepository);

        // CRUD
        this.services.register(GetTasks, () => new GetTasks(taskRepo()));
        this.services.register(GetTask, () => new GetTask(taskRepo(), noteRepo()));
        this.services.register(CreateTask, () => new CreateTask(taskRepo()));
        this.services.register(UpdateTask, () => new UpdateTask(taskRepo()));
        this.services.register(DeleteTask, () => new DeleteTask(taskRepo(), noteRepo()));

        // Status transitions
        this.services.register(CompleteTask, () => new CompleteTask(taskRepo(), this.eventBus));
        this.services.register(CarryOverTask, () => new CarryOverTask(taskRepo(), this.eventBus));
        this.services.register(DiscardTask, () => new DiscardTask(taskRepo()));
        this.services.register(CarryOverAllPending, () =>
            new CarryOverAllPending(taskRepo(), this.services.get(CarryOverTask)),
        );

        // Review & Notes
        this.services.register(GetEndOfDayReview, () => new GetEndOfDayReview(taskRepo()));
        this.services.register(AddTaskNote, () => new AddTaskNote(noteRepo()));

        // Stats
        this.services.register(GetDayStats, () => new GetDayStats(taskRepo()));
        this.services.register(GetCompletionByDomain, () => new GetCompletionByDomain(taskRepo()));
        this.services.register(GetCarryOverRate, () => new GetCarryOverRate(taskRepo()));
        this.services.register(CheckTasksOverload, () => new CheckTasksOverload(taskRepo(), this.eventBus));
    }

    private registerSubscribers() {
        const taskRepo = () => this.repositories.get(TaskRepository);

        // Reactive: checks if all daily tasks are done after each completion
        new CheckDailyCompletion(taskRepo(), this.eventBus).subscribe();

        // Handlers: streaks, insights, proactive suggestions
        new TaskEventHandlers(this.eventBus, this.insightsStore).subscribe();

        // SSE: broadcast new insights to connected clients
        this.insightsStore.onInsight((insight) => {
            this.sseBroadcaster.broadcast('insight', insight);
        });
    }

    private registerAgents() {
        this.agentRegistry.register(
            new TaskAgent(this.eventBus, this.services, this.repositories, this.insightsStore),
        );
    }
}
