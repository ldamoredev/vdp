import type { Core, CoreModule } from "../../Core";
import type { ObjectivesGateway } from "../../domain/objectives/ObjectivesGateway";
import { HttpObjectivesGateway } from "../../infrastructure/http/HttpObjectivesGateway";
import { ArchiveObjective, ArchiveObjectiveHandler } from "./ArchiveObjective";
import { CreateObjective, CreateObjectiveHandler } from "./CreateObjective";
import { GetObjective, GetObjectiveHandler } from "./GetObjective";
import { ListObjectives, ListObjectivesHandler } from "./ListObjectives";
import { MarkObjectiveAchieved, MarkObjectiveAchievedHandler } from "./MarkObjectiveAchieved";
import { UpdateObjective, UpdateObjectiveHandler } from "./UpdateObjective";

export class ObjectivesModule implements CoreModule {
  constructor(private readonly gateway?: ObjectivesGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpObjectivesGateway(core.httpClient);

    core.bus.registerHandler(ListObjectives, () => new ListObjectivesHandler(gateway));
    core.bus.registerHandler(GetObjective, () => new GetObjectiveHandler(gateway));
    core.bus.registerHandler(CreateObjective, () => new CreateObjectiveHandler(gateway));
    core.bus.registerHandler(UpdateObjective, () => new UpdateObjectiveHandler(gateway));
    core.bus.registerHandler(ArchiveObjective, () => new ArchiveObjectiveHandler(gateway));
    core.bus.registerHandler(MarkObjectiveAchieved, () => new MarkObjectiveAchievedHandler(gateway));
  }
}
