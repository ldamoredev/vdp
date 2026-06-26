import { ModuleContext } from '../common/base/modules/ModuleContext';
import { TaskRepository } from '../tasks/domain/TaskRepository';
import { AssignTaskToProjectCommand, AssignTaskToProjectCommandHandler } from './app/AssignTaskToProjectCommand';
import { ArchiveClientCommand, ArchiveClientCommandHandler } from './app/ArchiveClientCommand';
import { ArchiveProjectCommand, ArchiveProjectCommandHandler } from './app/ArchiveProjectCommand';
import { CreateClientCommand, CreateClientCommandHandler } from './app/CreateClientCommand';
import { CreateProjectCommand, CreateProjectCommandHandler } from './app/CreateProjectCommand';
import { DeleteTimeEntryCommand, DeleteTimeEntryCommandHandler } from './app/DeleteTimeEntryCommand';
import { GetProjectHoursReportQuery, GetProjectHoursReportQueryHandler } from './app/GetProjectHoursReportQuery';
import { GetProjectQuery, GetProjectQueryHandler } from './app/GetProjectQuery';
import { ListClientsQuery, ListClientsQueryHandler } from './app/ListClientsQuery';
import { ListProjectsQuery, ListProjectsQueryHandler } from './app/ListProjectsQuery';
import { ListTimeEntriesQuery, ListTimeEntriesQueryHandler } from './app/ListTimeEntriesQuery';
import { LogTimeEntryCommand, LogTimeEntryCommandHandler } from './app/LogTimeEntryCommand';
import { UpdateClientCommand, UpdateClientCommandHandler } from './app/UpdateClientCommand';
import { UpdateProjectCommand, UpdateProjectCommandHandler } from './app/UpdateProjectCommand';
import { UpdateTimeEntryCommand, UpdateTimeEntryCommandHandler } from './app/UpdateTimeEntryCommand';
import { ClientRepository } from './domain/ClientRepository';
import { ProjectRepository } from './domain/ProjectRepository';
import { TimeEntryRepository } from './domain/TimeEntryRepository';
import { ProjectsController } from './infrastructure/routes/ProjectsController';

export class ProjectsModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerHandlers(): void {
        this.deps.bus.registerHandler(CreateClientCommand, () =>
            new CreateClientCommandHandler(this.clientRepository()),
        );
        this.deps.bus.registerHandler(ListClientsQuery, () =>
            new ListClientsQueryHandler(this.clientRepository()),
        );
        this.deps.bus.registerHandler(UpdateClientCommand, () =>
            new UpdateClientCommandHandler(this.clientRepository()),
        );
        this.deps.bus.registerHandler(ArchiveClientCommand, () =>
            new ArchiveClientCommandHandler(this.clientRepository()),
        );
        this.deps.bus.registerHandler(CreateProjectCommand, () =>
            new CreateProjectCommandHandler(this.projectRepository(), this.clientRepository()),
        );
        this.deps.bus.registerHandler(GetProjectQuery, () =>
            new GetProjectQueryHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(ListProjectsQuery, () =>
            new ListProjectsQueryHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(UpdateProjectCommand, () =>
            new UpdateProjectCommandHandler(this.projectRepository(), this.clientRepository()),
        );
        this.deps.bus.registerHandler(ArchiveProjectCommand, () =>
            new ArchiveProjectCommandHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(AssignTaskToProjectCommand, () =>
            new AssignTaskToProjectCommandHandler(this.projectRepository(), this.taskRepository()),
        );
        this.deps.bus.registerHandler(LogTimeEntryCommand, () =>
            new LogTimeEntryCommandHandler(this.projectRepository(), this.timeEntryRepository(), this.taskRepository()),
        );
        this.deps.bus.registerHandler(UpdateTimeEntryCommand, () =>
            new UpdateTimeEntryCommandHandler(this.projectRepository(), this.timeEntryRepository(), this.taskRepository()),
        );
        this.deps.bus.registerHandler(DeleteTimeEntryCommand, () =>
            new DeleteTimeEntryCommandHandler(this.timeEntryRepository()),
        );
        this.deps.bus.registerHandler(ListTimeEntriesQuery, () =>
            new ListTimeEntriesQueryHandler(this.timeEntryRepository()),
        );
        this.deps.bus.registerHandler(GetProjectHoursReportQuery, () =>
            new GetProjectHoursReportQueryHandler(
                this.timeEntryRepository(),
                this.projectRepository(),
                this.clientRepository(),
            ),
        );
    }

    createControllers() {
        return [new ProjectsController(this.deps.bus)];
    }

    private clientRepository(): ClientRepository {
        return this.deps.repositories.get(ClientRepository);
    }

    private projectRepository(): ProjectRepository {
        return this.deps.repositories.get(ProjectRepository);
    }

    private timeEntryRepository(): TimeEntryRepository {
        return this.deps.repositories.get(TimeEntryRepository);
    }

    private taskRepository(): TaskRepository {
        return this.deps.repositories.get(TaskRepository);
    }
}
