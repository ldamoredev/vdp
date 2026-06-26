import {
    assignTaskToProjectSchema,
    createClientSchema,
    createProjectSchema,
    idParamsSchema,
    logTimeEntrySchema,
    projectHoursReportQuerySchema,
    projectIdParamsSchema,
    timeEntryFiltersSchema,
    updateClientSchema,
    updateProjectSchema,
    updateTimeEntrySchema,
} from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { assertFound } from '../../../common/http/errors';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { RouteContextHandler } from '../../../common/http/routes';
import { ArchiveClientCommand } from '../../app/ArchiveClientCommand';
import { AssignTaskToProjectCommand } from '../../app/AssignTaskToProjectCommand';
import { ArchiveProjectCommand } from '../../app/ArchiveProjectCommand';
import { CreateClientCommand } from '../../app/CreateClientCommand';
import { CreateProjectCommand } from '../../app/CreateProjectCommand';
import { DeleteTimeEntryCommand } from '../../app/DeleteTimeEntryCommand';
import { GetProjectHoursReportQuery } from '../../app/GetProjectHoursReportQuery';
import { GetProjectQuery } from '../../app/GetProjectQuery';
import { ListClientsQuery } from '../../app/ListClientsQuery';
import { ListProjectsQuery } from '../../app/ListProjectsQuery';
import { ListTimeEntriesQuery } from '../../app/ListTimeEntriesQuery';
import { LogTimeEntryCommand } from '../../app/LogTimeEntryCommand';
import { UpdateClientCommand } from '../../app/UpdateClientCommand';
import { UpdateProjectCommand } from '../../app/UpdateProjectCommand';
import { UpdateTimeEntryCommand } from '../../app/UpdateTimeEntryCommand';

type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
type IdParams = z.infer<typeof idParamsSchema>;
type CreateProjectBody = z.input<typeof createProjectSchema>;
type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
type AssignTaskBody = z.infer<typeof assignTaskToProjectSchema>;
type CreateClientBody = z.infer<typeof createClientSchema>;
type UpdateClientBody = z.infer<typeof updateClientSchema>;
type LogTimeEntryBody = z.infer<typeof logTimeEntrySchema>;
type UpdateTimeEntryBody = z.infer<typeof updateTimeEntrySchema>;
type TimeEntryFiltersQuery = z.infer<typeof timeEntryFiltersSchema>;
type ProjectHoursReportQuery = z.infer<typeof projectHoursReportQuerySchema>;

export class ProjectsController extends HttpController {
    readonly prefix = '/api/v1/projects';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/', {}, this.listProjects)
            .get('/clients', {}, this.listClients)
            .post('/clients', { body: createClientSchema }, this.createClient)
            .put('/clients/:id', { params: idParamsSchema, body: updateClientSchema }, this.updateClient)
            .post('/clients/:id/archive', { params: idParamsSchema }, this.archiveClient)
            .get('/time-entries', { query: timeEntryFiltersSchema }, this.listTimeEntries)
            .post('/time-entries', { body: logTimeEntrySchema }, this.logTimeEntry)
            .put('/time-entries/:id', { params: idParamsSchema, body: updateTimeEntrySchema }, this.updateTimeEntry)
            .delete('/time-entries/:id', { params: idParamsSchema }, this.deleteTimeEntry)
            .get('/hours-report', { query: projectHoursReportQuerySchema }, this.getHoursReport)
            .get('/:id', { params: projectIdParamsSchema }, this.getProject)
            .post('/', { body: createProjectSchema }, this.createProject)
            .put('/:id', { params: projectIdParamsSchema, body: updateProjectSchema }, this.updateProject)
            .post('/:id/archive', { params: projectIdParamsSchema }, this.archiveProject)
            .post('/:id/tasks', { params: projectIdParamsSchema, body: assignTaskToProjectSchema }, this.assignTask);
    }

    private readonly listProjects: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const projects = await this.bus.execute(new ListProjectsQuery(), executionContextFromAuth(request.auth));
        return reply.send({ projects });
    };

    private readonly listClients: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const clients = await this.bus.execute(new ListClientsQuery(), executionContextFromAuth(request.auth));
        return reply.send({ clients });
    };

    private readonly createClient: RouteContextHandler<undefined, undefined, CreateClientBody> = async ({
        request,
        body,
        reply,
    }) => {
        const client = await this.bus.execute(new CreateClientCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, client);
    };

    private readonly updateClient: RouteContextHandler<IdParams, undefined, UpdateClientBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const client = assertFound(
            await this.bus.execute(new UpdateClientCommand(params!.id, body!), executionContextFromAuth(request.auth)),
            'Client not found',
        );
        return reply.send(client);
    };

    private readonly archiveClient: RouteContextHandler<IdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const client = assertFound(
            await this.bus.execute(new ArchiveClientCommand(params!.id), executionContextFromAuth(request.auth)),
            'Client not found',
        );
        return reply.send(client);
    };

    private readonly listTimeEntries: RouteContextHandler<undefined, TimeEntryFiltersQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const entries = await this.bus.execute(
            new ListTimeEntriesQuery(query ?? {}),
            executionContextFromAuth(request.auth),
        );
        return reply.send({ entries });
    };

    private readonly logTimeEntry: RouteContextHandler<undefined, undefined, LogTimeEntryBody> = async ({
        request,
        body,
        reply,
    }) => {
        const entry = await this.bus.execute(new LogTimeEntryCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, entry);
    };

    private readonly updateTimeEntry: RouteContextHandler<IdParams, undefined, UpdateTimeEntryBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const entry = assertFound(
            await this.bus.execute(new UpdateTimeEntryCommand(params!.id, body!), executionContextFromAuth(request.auth)),
            'Time entry not found',
        );
        return reply.send(entry);
    };

    private readonly deleteTimeEntry: RouteContextHandler<IdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const deleted = await this.bus.execute(
            new DeleteTimeEntryCommand(params!.id),
            executionContextFromAuth(request.auth),
        );
        return reply.send({ deleted });
    };

    private readonly getHoursReport: RouteContextHandler<undefined, ProjectHoursReportQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        const report = await this.bus.execute(
            new GetProjectHoursReportQuery(query!),
            executionContextFromAuth(request.auth),
        );
        return reply.send(report);
    };

    private readonly getProject: RouteContextHandler<ProjectIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const project = assertFound(
            await this.bus.execute(new GetProjectQuery(params!.id), executionContextFromAuth(request.auth)),
            'Project not found',
        );
        return reply.send(project);
    };

    private readonly createProject: RouteContextHandler<undefined, undefined, CreateProjectBody> = async ({
        request,
        body,
        reply,
    }) => {
        const project = await this.bus.execute(new CreateProjectCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, project);
    };

    private readonly updateProject: RouteContextHandler<ProjectIdParams, undefined, UpdateProjectBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const project = assertFound(
            await this.bus.execute(
                new UpdateProjectCommand(params!.id, body!),
                executionContextFromAuth(request.auth),
            ),
            'Project not found',
        );
        return reply.send(project);
    };

    private readonly archiveProject: RouteContextHandler<ProjectIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const project = assertFound(
            await this.bus.execute(new ArchiveProjectCommand(params!.id), executionContextFromAuth(request.auth)),
            'Project not found',
        );
        return reply.send(project);
    };

    private readonly assignTask: RouteContextHandler<ProjectIdParams, undefined, AssignTaskBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const task = assertFound(
            await this.bus.execute(
                new AssignTaskToProjectCommand(params!.id, body!.taskId, { boardStatus: body!.boardStatus }),
                executionContextFromAuth(request.auth),
            ),
            'Task not found',
        );
        return reply.send(task);
    };
}
