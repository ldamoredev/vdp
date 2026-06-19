import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { AddTaskNoteCommand, AddTaskNoteCommandHandler } from './app/AddTaskNoteCommand';
import { CarryOverAllPendingCommand, CarryOverAllPendingCommandHandler } from './app/CarryOverAllPendingCommand';
import { CarryOverTaskCommand, CarryOverTaskCommandHandler } from './app/CarryOverTaskCommand';
import { CompleteTaskCommand, CompleteTaskCommandHandler } from './app/CompleteTaskCommand';
import { CreateTaskCommand, CreateTaskCommandHandler } from './app/CreateTaskCommand';
import { DeleteTaskCommand, DeleteTaskCommandHandler } from './app/DeleteTaskCommand';
import { DiscardTaskCommand, DiscardTaskCommandHandler } from './app/DiscardTaskCommand';
import { FindSimilarTasksQuery, FindSimilarTasksQueryHandler } from './app/FindSimilarTasksQuery';
import { GetCarryOverRateQuery, GetCarryOverRateQueryHandler } from './app/GetCarryOverRateQuery';
import { GetCompletionByDomainQuery, GetCompletionByDomainQueryHandler } from './app/GetCompletionByDomainQuery';
import { GetEndOfDayReviewQuery, GetEndOfDayReviewQueryHandler } from './app/GetEndOfDayReviewQuery';
import { GetPlanningContextQuery, GetPlanningContextQueryHandler } from './app/GetPlanningContextQuery';
import { GetTaskQuery, GetTaskQueryHandler } from './app/GetTaskQuery';
import { GetTasksQuery, GetTasksQueryHandler } from './app/GetTasksQuery';
import { GetTasksSnapshotQuery, GetTasksSnapshotQueryHandler } from './app/GetTasksSnapshotQuery';
import { GetTodayStatsQuery, GetTodayStatsQueryHandler } from './app/GetTodayStatsQuery';
import { GetTrendStatsQuery, GetTrendStatsQueryHandler } from './app/GetTrendStatsQuery';
import { GetWeeklySummaryQuery, GetWeeklySummaryQueryHandler } from './app/GetWeeklySummaryQuery';
import { UpdateTaskCommand, UpdateTaskCommandHandler } from './app/UpdateTaskCommand';
import { TaskAgent } from './infrastructure/agent/TaskAgent';
import { TasksController } from './infrastructure/routes/TasksController';
import { TasksAgentController } from './infrastructure/routes/TasksAgentController';
import { TaskInsightsSSEController } from './infrastructure/routes/TaskInsightsSSEController';
import { TaskEmbeddingRepository } from './domain/TaskEmbeddingRepository';
import { TaskNoteRepository } from './domain/TaskNoteRepository';
import { TaskRepository } from './domain/TaskRepository';
import { TaskInsightsStore } from './services/TaskInsightsStore';
import { AddTaskNote } from './services/AddTaskNote';
import { CarryOverAllPending } from './services/CarryOverAllPending';
import { CarryOverTask } from './services/CarryOverTask';
import { CheckDailyCompletion } from './services/CheckDailyCompletion';
import { CheckTasksOverload } from './services/CheckTasksOverload';
import { CompleteTask } from './services/CompleteTask';
import { CreateTask } from './services/CreateTask';
import { DeleteTask } from './services/DeleteTask';
import { DetectRepeatPattern } from './services/DetectRepeatPattern';
import { DiscardTask } from './services/DiscardTask';
import { EmbedTask } from './services/EmbedTask';
import { FindSimilarTasks } from './services/FindSimilarTasks';
import { GetCarryOverRate } from './services/GetCarryOverRate';
import { GetCompletionByDomain } from './services/GetCompletionByDomain';
import { GetDayStats } from './services/GetDayStats';
import { GetEndOfDayReview } from './services/GetEndOfDayReview';
import { RebuildStreaks } from './services/RebuildStreaks';
import { RecommendationEngine } from './services/RecommendationEngine';
import { GetTask } from './services/GetTask';
import { GetTasks } from './services/GetTasks';
import { GetTasksSnapshot } from './services/GetTasksSnapshot';
import { GetWeeklySummary } from './services/GetWeeklySummary';
import { GetPlanningContext } from './services/GetPlanningContext';
import { TaskEventHandlers } from './services/TaskEventHandlers';
import { CrossDomainEventHandlers } from './services/CrossDomainEventHandlers';
import { UpdateTask } from './services/UpdateTask';

export interface TaskModuleRuntimeDeps extends ModuleContext {
    insightsStore: TaskInsightsStore;
}

export class TaskModuleRuntime {
    constructor(private deps: TaskModuleRuntimeDeps) {
    }


    registerServices(): void {
        this.registerEmbeddingServices();
        this.registerTaskReadServices();
        this.registerTaskMutationServices();
        this.registerTaskInsightServices();
    }

    registerHandlers(): void {
        this.deps.bus.registerHandler(GetTasksQuery, () =>
            new GetTasksQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetTaskQuery, () =>
            new GetTaskQueryHandler(this.taskRepository(), this.taskNoteRepository()),
        );
        this.deps.bus.registerHandler(CreateTaskCommand, () =>
            new CreateTaskCommandHandler(
                this.taskRepository(),
                this.deps.services.get(EmbedTask),
                this.deps.services.get(FindSimilarTasks),
            ),
        );
        this.deps.bus.registerHandler(UpdateTaskCommand, () =>
            new UpdateTaskCommandHandler(this.taskRepository(), this.deps.services.get(EmbedTask)),
        );
        this.deps.bus.registerHandler(DeleteTaskCommand, () =>
            new DeleteTaskCommandHandler(this.taskRepository(), this.taskNoteRepository()),
        );
        this.deps.bus.registerHandler(CompleteTaskCommand, () =>
            new CompleteTaskCommandHandler(this.taskRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(CarryOverTaskCommand, () =>
            new CarryOverTaskCommandHandler(
                this.taskRepository(),
                this.deps.eventBus,
                this.deps.services.get(DetectRepeatPattern),
            ),
        );
        this.deps.bus.registerHandler(DiscardTaskCommand, () =>
            new DiscardTaskCommandHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(CarryOverAllPendingCommand, () =>
            new CarryOverAllPendingCommandHandler(
                this.taskRepository(),
                this.deps.eventBus,
                this.deps.services.get(DetectRepeatPattern),
            ),
        );
        this.deps.bus.registerHandler(AddTaskNoteCommand, () =>
            new AddTaskNoteCommandHandler(
                this.taskRepository(),
                this.taskNoteRepository(),
                this.deps.services.get(EmbedTask),
            ),
        );
        this.deps.bus.registerHandler(GetEndOfDayReviewQuery, () =>
            new GetEndOfDayReviewQueryHandler(this.taskRepository(), this.deps.services.get(RecommendationEngine)),
        );
        this.deps.bus.registerHandler(GetTodayStatsQuery, () =>
            new GetTodayStatsQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetTrendStatsQuery, () =>
            new GetTrendStatsQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetCompletionByDomainQuery, () =>
            new GetCompletionByDomainQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetCarryOverRateQuery, () =>
            new GetCarryOverRateQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetTasksSnapshotQuery, () =>
            new GetTasksSnapshotQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetWeeklySummaryQuery, () =>
            new GetWeeklySummaryQueryHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(GetPlanningContextQuery, () =>
            new GetPlanningContextQueryHandler(this.taskRepository(), this.deps.insightsStore),
        );
        this.deps.bus.registerHandler(FindSimilarTasksQuery, () =>
            new FindSimilarTasksQueryHandler(this.taskEmbeddingRepository(), this.deps.embeddingProvider),
        );
    }

    registerEventHandlers(): void {
        this.subscribeToTaskEvents();
        this.subscribeInsightsToSSE();
    }

    registerAgent(): void {
        this.deps.agentRegistry.register(
            new TaskAgent(
                this.deps.bus,
                this.deps.repositories,
                this.deps.insightsStore,
                this.deps.llmTraceService,
                this.deps.traceService,
                this.deps.agentProvider,
                this.deps.logger,
                this.deps.authContextStorage,
            ),
        );
    }

    createControllers() {
        return [
            new TasksController(this.deps.bus),
            new TasksAgentController(this.deps.agentRegistry, this.agentRepository(), this.deps.authContextStorage),
            new TaskInsightsSSEController(this.deps.sseBroadcaster, this.deps.insightsStore),
        ];
    }

    private registerEmbeddingServices(): void {
        this.deps.services.register(
            EmbedTask,
            () =>
                new EmbedTask(
                    this.taskRepository(),
                    this.taskNoteRepository(),
                    this.taskEmbeddingRepository(),
                    this.deps.embeddingProvider,
                    this.deps.logger,
                ),
        );
        this.deps.services.register(
            FindSimilarTasks,
            () => new FindSimilarTasks(this.taskEmbeddingRepository(), this.deps.embeddingProvider),
        );
        this.deps.services.register(
            DetectRepeatPattern,
            () =>
                new DetectRepeatPattern(
                    this.deps.services.get(FindSimilarTasks),
                    this.taskRepository(),
                    this.deps.eventBus,
                ),
        );
    }

    private registerTaskReadServices(): void {
        this.deps.services.register(GetTasks, () => new GetTasks(this.taskRepository()));
        this.deps.services.register(GetTask, () => new GetTask(this.taskRepository(), this.taskNoteRepository()));
        this.deps.services.register(GetTasksSnapshot, () => new GetTasksSnapshot(this.taskRepository()));
        this.deps.services.register(RecommendationEngine, () => new RecommendationEngine());
        this.deps.services.register(GetEndOfDayReview, () =>
            new GetEndOfDayReview(this.taskRepository(), this.deps.services.get(RecommendationEngine)),
        );
        this.deps.services.register(GetDayStats, () => new GetDayStats(this.taskRepository()));
        this.deps.services.register(GetCompletionByDomain, () =>
            new GetCompletionByDomain(this.taskRepository()),
        );
        this.deps.services.register(GetCarryOverRate, () =>
            new GetCarryOverRate(this.taskRepository()),
        );
        this.deps.services.register(GetWeeklySummary, () =>
            new GetWeeklySummary(this.taskRepository(), this.deps.services.get(GetDayStats)),
        );
        this.deps.services.register(GetPlanningContext, () =>
            new GetPlanningContext(
                this.taskRepository(),
                this.deps.services.get(GetDayStats),
                this.deps.services.get(GetCarryOverRate),
                this.deps.insightsStore,
            ),
        );
    }

    private registerTaskMutationServices(): void {
        this.deps.services.register(CreateTask, () =>
            new CreateTask(this.taskRepository(), this.deps.services.get(EmbedTask), this.deps.services.get(FindSimilarTasks)),
        );
        this.deps.services.register(UpdateTask, () =>
            new UpdateTask(this.taskRepository(), this.deps.services.get(EmbedTask)),
        );
        this.deps.services.register(DeleteTask, () =>
            new DeleteTask(this.taskRepository(), this.taskNoteRepository()),
        );
        this.deps.services.register(
            AddTaskNote,
            () =>
                new AddTaskNote(
                    this.taskRepository(),
                    this.taskNoteRepository(),
                    this.deps.services.get(EmbedTask),
                ),
        );
        this.deps.services.register(CompleteTask, () =>
            new CompleteTask(this.taskRepository(), this.deps.eventBus),
        );
        this.deps.services.register(CarryOverTask, () =>
            new CarryOverTask(this.taskRepository(), this.deps.eventBus, this.deps.services.get(DetectRepeatPattern)),
        );
        this.deps.services.register(DiscardTask, () => new DiscardTask(this.taskRepository()));
        this.deps.services.register(
            CarryOverAllPending,
            () =>
                new CarryOverAllPending(
                    this.taskRepository(),
                    this.deps.services.get(CarryOverTask),
                ),
        );
    }

    private registerTaskInsightServices(): void {
        this.deps.services.register(
            CheckTasksOverload,
            () => new CheckTasksOverload(this.taskRepository(), this.deps.eventBus),
        );
        this.deps.services.register(
            RebuildStreaks,
            () => new RebuildStreaks(this.taskRepository(), this.deps.insightsStore),
        );
    }

    /**
     * Called once at server start. A rehydration failure must never block
     * boot: streaks fall back to the pre-existing behavior (empty until the
     * next perfect day).
     */
    async rehydrateStreaks(): Promise<void> {
        try {
            await this.deps.services.get(RebuildStreaks).execute();
        } catch (err: unknown) {
            this.deps.logger.warn('streak rehydration failed', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    /**
     * Called once at server start. A rehydration failure must never block
     * boot: insights fall back to an empty store, as before persistence.
     */
    async rehydrateInsights(): Promise<void> {
        try {
            await this.deps.insightsStore.hydrate();
        } catch (err: unknown) {
            this.deps.logger.warn('task insight rehydration failed', {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    private subscribeToTaskEvents(): void {
        const subscribers = [
            new CheckDailyCompletion(this.taskRepository(), this.deps.eventBus),
            new TaskEventHandlers(this.deps.eventBus, this.deps.insightsStore),
            new CrossDomainEventHandlers(
                this.deps.eventBus,
                this.deps.insightsStore,
                this.deps.services.get(CreateTask),
                this.deps.logger,
            ),
        ];

        for (const subscriber of subscribers) {
            subscriber.subscribe();
        }
    }

    private subscribeInsightsToSSE(): void {
        this.deps.insightsStore.onInsight((insight, userId) => {
            // If the target user has at least one connected client, the insight will be
            // delivered live — mark it as read so it won't re-appear in the snapshot.
            if (this.deps.sseBroadcaster.hasClients(userId)) {
                this.deps.insightsStore.markInsightRead(userId, insight.id);
                insight.read = true;
            }
            this.deps.sseBroadcaster.broadcastToUser(userId, 'insight', insight);
        });
    }

    private taskRepository(): TaskRepository {
        return this.deps.repositories.get(TaskRepository);
    }

    private taskNoteRepository(): TaskNoteRepository {
        return this.deps.repositories.get(TaskNoteRepository);
    }

    private taskEmbeddingRepository(): TaskEmbeddingRepository {
        return this.deps.repositories.get(TaskEmbeddingRepository);
    }

    private agentRepository(): AgentRepository {
        return this.deps.repositories.get(AgentRepository);
    }
}
