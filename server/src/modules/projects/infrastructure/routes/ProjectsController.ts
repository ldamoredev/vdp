import {
    assignTaskToProjectSchema,
    createProjectSchema,
    projectIdParamsSchema,
    updateProjectSchema,
} from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { assertFound } from '../../../common/http/errors';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { RouteContextHandler } from '../../../common/http/routes';
import { AssignTaskToProjectCommand } from '../../app/AssignTaskToProjectCommand';
import { ArchiveProjectCommand } from '../../app/ArchiveProjectCommand';
import { CreateProjectCommand } from '../../app/CreateProjectCommand';
import { GetProjectQuery } from '../../app/GetProjectQuery';
import { ListProjectsQuery } from '../../app/ListProjectsQuery';
import { UpdateProjectCommand } from '../../app/UpdateProjectCommand';

type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
type CreateProjectBody = z.input<typeof createProjectSchema>;
type UpdateProjectBody = z.infer<typeof updateProjectSchema>;
type AssignTaskBody = z.infer<typeof assignTaskToProjectSchema>;

export class ProjectsController extends HttpController {
    readonly prefix = '/api/v1/projects';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/', {}, this.listProjects)
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
