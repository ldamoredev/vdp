import type { Core, CoreModule } from "../../Core";
import type { TasksGateway } from "../../domain/tasks/TasksGateway";
import { HttpTasksGateway } from "../../infrastructure/http/HttpTasksGateway";

import { AddTaskNote, AddTaskNoteHandler } from "./AddTaskNote";
import { CarryOverAll, CarryOverAllHandler } from "./CarryOverAll";
import { CarryOverTask, CarryOverTaskHandler } from "./CarryOverTask";
import { CompleteTask, CompleteTaskHandler } from "./CompleteTask";
import { CreateTask, CreateTaskHandler } from "./CreateTask";
import { DeleteTask, DeleteTaskHandler } from "./DeleteTask";
import { GetDailyReviewState, GetDailyReviewStateHandler } from "./GetDailyReviewState";
import { SaveDailyReviewState, SaveDailyReviewStateHandler } from "./SaveDailyReviewState";
import { DiscardTask, DiscardTaskHandler } from "./DiscardTask";
import { GetCarryOverRate, GetCarryOverRateHandler } from "./GetCarryOverRate";
import { GetRecentInsights, GetRecentInsightsHandler } from "./GetRecentInsights";
import { GetTask, GetTaskHandler } from "./GetTask";
import { GetTaskReview, GetTaskReviewHandler } from "./GetTaskReview";
import { GetTaskTrend, GetTaskTrendHandler } from "./GetTaskTrend";
import { GetTasksByDomain, GetTasksByDomainHandler } from "./GetTasksByDomain";
import { GetTodayStats, GetTodayStatsHandler } from "./GetTodayStats";
import { ListTaskNotes, ListTaskNotesHandler } from "./ListTaskNotes";
import { ListTasks, ListTasksHandler } from "./ListTasks";
import { StartTask, StartTaskHandler } from "./StartTask";
import { UpdateTask, UpdateTaskHandler } from "./UpdateTask";

/**
 * Wires the tasks module into the Core: builds the gateway from the shared HTTP
 * client and registers every command/query handler on the bus. Frontend
 * analogue of the backend's TaskModuleRuntime. Accepts an injected gateway for
 * tests.
 */
export class TasksModule implements CoreModule {
  constructor(private readonly gateway?: TasksGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpTasksGateway(core.httpClient);

    core.bus.registerHandler(ListTasks, () => new ListTasksHandler(gateway));
    core.bus.registerHandler(GetTask, () => new GetTaskHandler(gateway));
    core.bus.registerHandler(CreateTask, () => new CreateTaskHandler(gateway));
    core.bus.registerHandler(UpdateTask, () => new UpdateTaskHandler(gateway));
    core.bus.registerHandler(DeleteTask, () => new DeleteTaskHandler(gateway));

    core.bus.registerHandler(StartTask, () => new StartTaskHandler(gateway));
    core.bus.registerHandler(CompleteTask, () => new CompleteTaskHandler(gateway));
    core.bus.registerHandler(CarryOverTask, () => new CarryOverTaskHandler(gateway));
    core.bus.registerHandler(DiscardTask, () => new DiscardTaskHandler(gateway));
    core.bus.registerHandler(CarryOverAll, () => new CarryOverAllHandler(gateway));

    core.bus.registerHandler(GetTaskReview, () => new GetTaskReviewHandler(gateway));
    core.bus.registerHandler(GetDailyReviewState, () => new GetDailyReviewStateHandler(gateway));
    core.bus.registerHandler(SaveDailyReviewState, () => new SaveDailyReviewStateHandler(gateway));
    core.bus.registerHandler(GetRecentInsights, () => new GetRecentInsightsHandler(gateway));
    core.bus.registerHandler(ListTaskNotes, () => new ListTaskNotesHandler(gateway));
    core.bus.registerHandler(AddTaskNote, () => new AddTaskNoteHandler(gateway));

    core.bus.registerHandler(GetTodayStats, () => new GetTodayStatsHandler(gateway));
    core.bus.registerHandler(GetTaskTrend, () => new GetTaskTrendHandler(gateway));
    core.bus.registerHandler(GetTasksByDomain, () => new GetTasksByDomainHandler(gateway));
    core.bus.registerHandler(GetCarryOverRate, () => new GetCarryOverRateHandler(gateway));
  }
}
