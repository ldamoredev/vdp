import type { Core, CoreModule } from "../../Core";
import type { HealthGateway } from "../../domain/health/HealthGateway";
import { HttpHealthGateway } from "../../infrastructure/http/HttpHealthGateway";

import { ArchiveCounter, ArchiveCounterHandler } from "./ArchiveCounter";
import { ArchiveHabit, ArchiveHabitHandler } from "./ArchiveHabit";
import { CompleteGoal, CompleteGoalHandler } from "./CompleteGoal";
import { CompleteHabit, CompleteHabitHandler } from "./CompleteHabit";
import { CreateCounter, CreateCounterHandler } from "./CreateCounter";
import { CreateGoal, CreateGoalHandler } from "./CreateGoal";
import { CreateHabit, CreateHabitHandler } from "./CreateHabit";
import { DropGoal, DropGoalHandler } from "./DropGoal";
import { GetCountersOverview, GetCountersOverviewHandler } from "./GetCountersOverview";
import { GetGoalsOverview, GetGoalsOverviewHandler } from "./GetGoalsOverview";
import { GetHabitsOverview, GetHabitsOverviewHandler } from "./GetHabitsOverview";
import { GraduateGoal, GraduateGoalHandler } from "./GraduateGoal";
import { RelapseCounter, RelapseCounterHandler } from "./RelapseCounter";
import { UncompleteHabit, UncompleteHabitHandler } from "./UncompleteHabit";

/**
 * Wires the health module into the Core: builds the gateway from the shared
 * HTTP client and registers every command/query handler on the bus. The
 * frontend analogue of the backend's HealthModuleRuntime. Accepts an injected
 * gateway for tests.
 */
export class HealthModule implements CoreModule {
  constructor(private readonly gateway?: HealthGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpHealthGateway(core.httpClient);

    core.bus.registerHandler(GetHabitsOverview, () => new GetHabitsOverviewHandler(gateway));
    core.bus.registerHandler(CreateHabit, () => new CreateHabitHandler(gateway));
    core.bus.registerHandler(CompleteHabit, () => new CompleteHabitHandler(gateway));
    core.bus.registerHandler(UncompleteHabit, () => new UncompleteHabitHandler(gateway));
    core.bus.registerHandler(ArchiveHabit, () => new ArchiveHabitHandler(gateway));

    core.bus.registerHandler(GetCountersOverview, () => new GetCountersOverviewHandler(gateway));
    core.bus.registerHandler(CreateCounter, () => new CreateCounterHandler(gateway));
    core.bus.registerHandler(RelapseCounter, () => new RelapseCounterHandler(gateway));
    core.bus.registerHandler(ArchiveCounter, () => new ArchiveCounterHandler(gateway));

    core.bus.registerHandler(GetGoalsOverview, () => new GetGoalsOverviewHandler(gateway));
    core.bus.registerHandler(CreateGoal, () => new CreateGoalHandler(gateway));
    core.bus.registerHandler(CompleteGoal, () => new CompleteGoalHandler(gateway));
    core.bus.registerHandler(DropGoal, () => new DropGoalHandler(gateway));
    core.bus.registerHandler(GraduateGoal, () => new GraduateGoalHandler(gateway));
  }
}
