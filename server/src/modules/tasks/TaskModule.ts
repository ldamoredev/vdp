import { TaskRepository } from './domain/TaskRepository';
import { TaskNoteRepository } from './domain/TaskNoteRepository';
import { AgentRepository } from '../common/base/agents/AgentRepository';
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
import { TaskAgent } from './infrastructure/agent/TaskAgent';
import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { TasksController } from './infrastructure/routes/TasksController';
import { TasksAgentController } from './infrastructure/routes/TasksAgentController';
import { TaskInsightsSSEController } from './infrastructure/routes/TaskInsightsSSEController';

export class TaskModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'tasks',
        label: 'Tasks',
    };

    readonly insightsStore = new TaskInsightsStore();

    constructor(context: ModuleContext) {
        super(context);
    }

    protected registerServices() {
        const taskRepo = () => this.repositories.get(TaskRepository);
        const noteRepo = () => this.repositories.get(TaskNoteRepository);

        this.services.register(GetTasks, () => new GetTasks(taskRepo()));
        this.services.register(GetTask, () => new GetTask(taskRepo(), noteRepo()));
        this.services.register(CreateTask, () => new CreateTask(taskRepo()));
        this.services.register(UpdateTask, () => new UpdateTask(taskRepo()));
        this.services.register(DeleteTask, () => new DeleteTask(taskRepo(), noteRepo()));

        this.services.register(CompleteTask, () => new CompleteTask(taskRepo(), this.eventBus));
        this.services.register(CarryOverTask, () => new CarryOverTask(taskRepo(), this.eventBus));
        this.services.register(DiscardTask, () => new DiscardTask(taskRepo()));
        this.services.register(CarryOverAllPending, () =>
            new CarryOverAllPending(taskRepo(), this.services.get(CarryOverTask)),
        );

        this.services.register(GetEndOfDayReview, () => new GetEndOfDayReview(taskRepo()));
        this.services.register(AddTaskNote, () => new AddTaskNote(taskRepo(), noteRepo()));

        this.services.register(GetDayStats, () => new GetDayStats(taskRepo()));
        this.services.register(GetCompletionByDomain, () => new GetCompletionByDomain(taskRepo()));
        this.services.register(GetCarryOverRate, () => new GetCarryOverRate(taskRepo()));
        this.services.register(CheckTasksOverload, () => new CheckTasksOverload(taskRepo(), this.eventBus));
    }

    protected registerEventHandlers() {
        const taskRepo = () => this.repositories.get(TaskRepository);

        this.registerSubscribers(
            new CheckDailyCompletion(taskRepo(), this.eventBus),
            new TaskEventHandlers(this.eventBus, this.insightsStore),
        );

        this.insightsStore.onInsight((insight) => {
            this.sseBroadcaster.broadcast('insight', insight);
        });
    }

    protected registerAgents() {
        this.agentRegistry.register(
            new TaskAgent(
                this.eventBus,
                this.services,
                this.repositories,
                this.insightsStore,
                this.llmTraceService,
                this.traceService,
                this.agentProvider
            ),
        );
    }

    getControllers(): HttpController[] {
        return [
            new TasksController(this.services),
            new TasksAgentController(this.agentRegistry, this.repositories.get(AgentRepository)),
            new TaskInsightsSSEController(this.sseBroadcaster, this.insightsStore),
        ];
    }

    getDescriptor(): DomainModuleDescriptor {
        return TaskModule.descriptor;
    }
}
