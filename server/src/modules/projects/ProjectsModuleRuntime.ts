import { ModuleContext } from '../common/base/modules/ModuleContext';
import { TaskRepository } from '../tasks/domain/TaskRepository';
import { AssignTaskToProjectCommand, AssignTaskToProjectCommandHandler } from './app/AssignTaskToProjectCommand';
import { ArchiveProjectCommand, ArchiveProjectCommandHandler } from './app/ArchiveProjectCommand';
import { CreateProjectCommand, CreateProjectCommandHandler } from './app/CreateProjectCommand';
import { GetProjectQuery, GetProjectQueryHandler } from './app/GetProjectQuery';
import { ListProjectsQuery, ListProjectsQueryHandler } from './app/ListProjectsQuery';
import { UpdateProjectCommand, UpdateProjectCommandHandler } from './app/UpdateProjectCommand';
import { ProjectRepository } from './domain/ProjectRepository';
import { ProjectsController } from './infrastructure/routes/ProjectsController';

export class ProjectsModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerHandlers(): void {
        this.deps.bus.registerHandler(CreateProjectCommand, () =>
            new CreateProjectCommandHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(GetProjectQuery, () =>
            new GetProjectQueryHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(ListProjectsQuery, () =>
            new ListProjectsQueryHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(UpdateProjectCommand, () =>
            new UpdateProjectCommandHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(ArchiveProjectCommand, () =>
            new ArchiveProjectCommandHandler(this.projectRepository()),
        );
        this.deps.bus.registerHandler(AssignTaskToProjectCommand, () =>
            new AssignTaskToProjectCommandHandler(this.projectRepository(), this.taskRepository()),
        );
    }

    createControllers() {
        return [new ProjectsController(this.deps.bus)];
    }

    private projectRepository(): ProjectRepository {
        return this.deps.repositories.get(ProjectRepository);
    }

    private taskRepository(): TaskRepository {
        return this.deps.repositories.get(TaskRepository);
    }
}
