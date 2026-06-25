import type { Core, CoreModule } from "../../Core";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";
import { HttpProjectsGateway } from "../../infrastructure/http/HttpProjectsGateway";
import { ArchiveProject, ArchiveProjectHandler } from "./ArchiveProject";
import { AssignTaskToProject, AssignTaskToProjectHandler } from "./AssignTaskToProject";
import { CreateProject, CreateProjectHandler } from "./CreateProject";
import { GetProject, GetProjectHandler } from "./GetProject";
import { ListProjects, ListProjectsHandler } from "./ListProjects";
import { UpdateProject, UpdateProjectHandler } from "./UpdateProject";

export class ProjectsModule implements CoreModule {
  constructor(private readonly gateway?: ProjectsGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpProjectsGateway(core.httpClient);

    core.bus.registerHandler(ListProjects, () => new ListProjectsHandler(gateway));
    core.bus.registerHandler(GetProject, () => new GetProjectHandler(gateway));
    core.bus.registerHandler(CreateProject, () => new CreateProjectHandler(gateway));
    core.bus.registerHandler(UpdateProject, () => new UpdateProjectHandler(gateway));
    core.bus.registerHandler(ArchiveProject, () => new ArchiveProjectHandler(gateway));
    core.bus.registerHandler(AssignTaskToProject, () => new AssignTaskToProjectHandler(gateway));
  }
}
