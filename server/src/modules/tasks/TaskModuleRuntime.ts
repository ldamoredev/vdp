import { AgentRepository } from '../common/base/agents/AgentRepository';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { ProjectRepository } from '../projects/domain/ProjectRepository';
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
import { GetDailyReviewStateQuery, GetDailyReviewStateQueryHandler } from './app/GetDailyReviewStateQuery';
import { SaveDailyReviewStateCommand, SaveDailyReviewStateCommandHandler } from './app/SaveDailyReviewStateCommand';
import { GetPlanningContextQuery, GetPlanningContextQueryHandler } from './app/GetPlanningContextQuery';
import { GetTaskQuery, GetTaskQueryHandler } from './app/GetTaskQuery';
import { GetTasksQuery, GetTasksQueryHandler } from './app/GetTasksQuery';
import { GetTasksSnapshotQuery, GetTasksSnapshotQueryHandler } from './app/GetTasksSnapshotQuery';
import { GetTodayStatsQuery, GetTodayStatsQueryHandler } from './app/GetTodayStatsQuery';
import { GetTrendStatsQuery, GetTrendStatsQueryHandler } from './app/GetTrendStatsQuery';
import { GetWeeklySummaryQuery, GetWeeklySummaryQueryHandler } from './app/GetWeeklySummaryQuery';
import { StartTaskCommand, StartTaskCommandHandler } from './app/StartTaskCommand';
import { UpdateTaskCommand, UpdateTaskCommandHandler } from './app/UpdateTaskCommand';
import { TaskAgent } from './infrastructure/agent/TaskAgent';
import { TasksController } from './infrastructure/routes/TasksController';
import { TasksAgentController } from './infrastructure/routes/TasksAgentController';
import { TaskInsightsSSEController } from './infrastructure/routes/TaskInsightsSSEController';
import { TaskEmbeddingRepository } from './domain/TaskEmbeddingRepository';
import { TaskNoteRepository } from './domain/TaskNoteRepository';
import { TaskRepository } from './domain/TaskRepository';
import { DailyReviewStateRepository } from './domain/DailyReviewStateRepository';
import { TaskInsightsStore } from './services/TaskInsightsStore';
import { CheckDailyCompletion } from './services/CheckDailyCompletion';
import { DetectRepeatPattern } from './services/DetectRepeatPattern';
import { EmbedTask } from './services/EmbedTask';
import { FindSimilarTasks } from './services/FindSimilarTasks';
import { RebuildStreaks } from './services/RebuildStreaks';
import { RecommendationEngine } from './services/RecommendationEngine';
import { TaskEventHandlers } from './services/TaskEventHandlers';
import { CrossDomainEventHandlers } from './services/CrossDomainEventHandlers';

export interface TaskModuleRuntimeDeps extends ModuleContext {
    insightsStore: TaskInsightsStore;
}

export class TaskModuleRuntime {
    constructor(private deps: TaskModuleRuntimeDeps) {}

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
                this.projectRepository(),
                this.embedTask(),
                this.findSimilarTasks(),
            ),
        );
        this.deps.bus.registerHandler(UpdateTaskCommand, () =>
            new UpdateTaskCommandHandler(this.taskRepository(), this.projectRepository(), this.embedTask()),
        );
        this.deps.bus.registerHandler(DeleteTaskCommand, () =>
            new DeleteTaskCommandHandler(this.taskRepository(), this.taskNoteRepository()),
        );
        this.deps.bus.registerHandler(CompleteTaskCommand, () =>
            new CompleteTaskCommandHandler(this.taskRepository(), this.deps.eventBus),
        );
        this.deps.bus.registerHandler(StartTaskCommand, () =>
            new StartTaskCommandHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(CarryOverTaskCommand, () =>
            new CarryOverTaskCommandHandler(
                this.taskRepository(),
                this.deps.eventBus,
                this.detectRepeatPattern(),
            ),
        );
        this.deps.bus.registerHandler(DiscardTaskCommand, () =>
            new DiscardTaskCommandHandler(this.taskRepository()),
        );
        this.deps.bus.registerHandler(CarryOverAllPendingCommand, () =>
            new CarryOverAllPendingCommandHandler(
                this.taskRepository(),
                this.deps.eventBus,
                this.detectRepeatPattern(),
            ),
        );
        this.deps.bus.registerHandler(AddTaskNoteCommand, () =>
            new AddTaskNoteCommandHandler(
                this.taskRepository(),
                this.taskNoteRepository(),
                this.embedTask(),
            ),
        );
        this.deps.bus.registerHandler(GetEndOfDayReviewQuery, () =>
            new GetEndOfDayReviewQueryHandler(this.taskRepository(), this.recommendationEngine()),
        );
        this.deps.bus.registerHandler(GetDailyReviewStateQuery, () =>
            new GetDailyReviewStateQueryHandler(this.dailyReviewStateRepository()),
        );
        this.deps.bus.registerHandler(SaveDailyReviewStateCommand, () =>
            new SaveDailyReviewStateCommandHandler(this.dailyReviewStateRepository(), this.taskRepository()),
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

    /**
     * Called once at server start. A rehydration failure must never block
     * boot: streaks fall back to the pre-existing behavior (empty until the
     * next perfect day).
     */
    async rehydrateStreaks(): Promise<void> {
        try {
            await new RebuildStreaks(this.taskRepository(), this.deps.insightsStore).execute();
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
                this.deps.bus,
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

    private embedTask(): EmbedTask {
        return new EmbedTask(
            this.taskRepository(),
            this.taskNoteRepository(),
            this.taskEmbeddingRepository(),
            this.deps.embeddingProvider,
            this.deps.logger,
        );
    }

    private findSimilarTasks(): FindSimilarTasks {
        return new FindSimilarTasks(this.taskEmbeddingRepository(), this.deps.embeddingProvider);
    }

    private detectRepeatPattern(): DetectRepeatPattern {
        return new DetectRepeatPattern(
            this.findSimilarTasks(),
            this.taskRepository(),
            this.deps.eventBus,
        );
    }

    private recommendationEngine(): RecommendationEngine {
        return new RecommendationEngine();
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

    private dailyReviewStateRepository(): DailyReviewStateRepository {
        return this.deps.repositories.get(DailyReviewStateRepository);
    }

    private projectRepository(): ProjectRepository {
        return this.deps.repositories.get(ProjectRepository);
    }

    private agentRepository(): AgentRepository {
        return this.deps.repositories.get(AgentRepository);
    }
}
