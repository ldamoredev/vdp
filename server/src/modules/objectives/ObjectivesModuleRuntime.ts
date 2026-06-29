import { ModuleContext } from '../common/base/modules/ModuleContext';
import { ArchiveObjectiveCommand, ArchiveObjectiveCommandHandler } from './app/ArchiveObjectiveCommand';
import { CreateObjectiveCommand, CreateObjectiveCommandHandler } from './app/CreateObjectiveCommand';
import { GetObjectiveQuery, GetObjectiveQueryHandler } from './app/GetObjectiveQuery';
import { ListObjectivesQuery, ListObjectivesQueryHandler } from './app/ListObjectivesQuery';
import { UpdateObjectiveCommand, UpdateObjectiveCommandHandler } from './app/UpdateObjectiveCommand';
import { ObjectiveRepository } from './domain/ObjectiveRepository';
import { ObjectivesController } from './infrastructure/routes/ObjectivesController';

export class ObjectivesModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerHandlers(): void {
        this.deps.bus.registerHandler(CreateObjectiveCommand, () =>
            new CreateObjectiveCommandHandler(this.objectiveRepository()),
        );
        this.deps.bus.registerHandler(GetObjectiveQuery, () =>
            new GetObjectiveQueryHandler(this.objectiveRepository()),
        );
        this.deps.bus.registerHandler(ListObjectivesQuery, () =>
            new ListObjectivesQueryHandler(this.objectiveRepository()),
        );
        this.deps.bus.registerHandler(UpdateObjectiveCommand, () =>
            new UpdateObjectiveCommandHandler(this.objectiveRepository()),
        );
        this.deps.bus.registerHandler(ArchiveObjectiveCommand, () =>
            new ArchiveObjectiveCommandHandler(this.objectiveRepository()),
        );
    }

    createControllers() {
        return [new ObjectivesController(this.deps.bus)];
    }

    private objectiveRepository(): ObjectiveRepository {
        return this.deps.repositories.get(ObjectiveRepository);
    }
}
