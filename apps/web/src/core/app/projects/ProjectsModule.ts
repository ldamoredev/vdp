import type { Core, CoreModule } from "../../Core";
import type { ProjectsGateway } from "../../domain/projects/ProjectsGateway";
import { HttpProjectsGateway } from "../../infrastructure/http/HttpProjectsGateway";
import { ArchiveClient, ArchiveClientHandler } from "./ArchiveClient";
import { ArchiveProject, ArchiveProjectHandler } from "./ArchiveProject";
import { AssignTaskToProject, AssignTaskToProjectHandler } from "./AssignTaskToProject";
import { CreateClient, CreateClientHandler } from "./CreateClient";
import { CreateProject, CreateProjectHandler } from "./CreateProject";
import { DeleteTimeEntry, DeleteTimeEntryHandler } from "./DeleteTimeEntry";
import { GetHoursReport, GetHoursReportHandler } from "./GetHoursReport";
import { GetProject, GetProjectHandler } from "./GetProject";
import { ListClients, ListClientsHandler } from "./ListClients";
import { ListProjects, ListProjectsHandler } from "./ListProjects";
import { ListTimeEntries, ListTimeEntriesHandler } from "./ListTimeEntries";
import { LogTimeEntry, LogTimeEntryHandler } from "./LogTimeEntry";
import { UpdateClient, UpdateClientHandler } from "./UpdateClient";
import { UpdateProject, UpdateProjectHandler } from "./UpdateProject";
import { UpdateTimeEntry, UpdateTimeEntryHandler } from "./UpdateTimeEntry";

export class ProjectsModule implements CoreModule {
  constructor(private readonly gateway?: ProjectsGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpProjectsGateway(core.httpClient);

    core.bus.registerHandler(ListClients, () => new ListClientsHandler(gateway));
    core.bus.registerHandler(CreateClient, () => new CreateClientHandler(gateway));
    core.bus.registerHandler(UpdateClient, () => new UpdateClientHandler(gateway));
    core.bus.registerHandler(ArchiveClient, () => new ArchiveClientHandler(gateway));
    core.bus.registerHandler(ListProjects, () => new ListProjectsHandler(gateway));
    core.bus.registerHandler(GetProject, () => new GetProjectHandler(gateway));
    core.bus.registerHandler(CreateProject, () => new CreateProjectHandler(gateway));
    core.bus.registerHandler(UpdateProject, () => new UpdateProjectHandler(gateway));
    core.bus.registerHandler(ArchiveProject, () => new ArchiveProjectHandler(gateway));
    core.bus.registerHandler(AssignTaskToProject, () => new AssignTaskToProjectHandler(gateway));
    core.bus.registerHandler(ListTimeEntries, () => new ListTimeEntriesHandler(gateway));
    core.bus.registerHandler(LogTimeEntry, () => new LogTimeEntryHandler(gateway));
    core.bus.registerHandler(UpdateTimeEntry, () => new UpdateTimeEntryHandler(gateway));
    core.bus.registerHandler(DeleteTimeEntry, () => new DeleteTimeEntryHandler(gateway));
    core.bus.registerHandler(GetHoursReport, () => new GetHoursReportHandler(gateway));
  }
}
