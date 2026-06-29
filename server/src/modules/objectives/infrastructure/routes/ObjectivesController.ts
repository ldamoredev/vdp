import { createObjectiveSchema, objectiveIdParamsSchema, updateObjectiveSchema } from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { assertFound } from '../../../common/http/errors';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { RouteContextHandler } from '../../../common/http/routes';
import { ArchiveObjectiveCommand } from '../../app/ArchiveObjectiveCommand';
import { CreateObjectiveCommand } from '../../app/CreateObjectiveCommand';
import { GetObjectiveQuery } from '../../app/GetObjectiveQuery';
import { ListObjectivesQuery } from '../../app/ListObjectivesQuery';
import { MarkObjectiveAchievedCommand } from '../../app/MarkObjectiveAchievedCommand';
import { serializeObjective } from '../../app/serialize';
import { UpdateObjectiveCommand } from '../../app/UpdateObjectiveCommand';

type ObjectiveIdParams = z.infer<typeof objectiveIdParamsSchema>;
type CreateObjectiveBody = z.infer<typeof createObjectiveSchema>;
type UpdateObjectiveBody = z.infer<typeof updateObjectiveSchema>;

export class ObjectivesController extends HttpController {
    readonly prefix = '/api/v1/objectives';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/', {}, this.listObjectives)
            .get('/:id', { params: objectiveIdParamsSchema }, this.getObjective)
            .post('/', { body: createObjectiveSchema }, this.createObjective)
            .put('/:id', { params: objectiveIdParamsSchema, body: updateObjectiveSchema }, this.updateObjective)
            .post('/:id/achieve', { params: objectiveIdParamsSchema }, this.markObjectiveAchieved)
            .post('/:id/archive', { params: objectiveIdParamsSchema }, this.archiveObjective);
    }

    private readonly listObjectives: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const objectives = await this.bus.execute(
            new ListObjectivesQuery(),
            executionContextFromAuth(request.auth),
        );
        return reply.send({ objectives: objectives.map(serializeObjective) });
    };

    private readonly getObjective: RouteContextHandler<ObjectiveIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const objective = assertFound(
            await this.bus.execute(new GetObjectiveQuery(params!.id), executionContextFromAuth(request.auth)),
            'Objective not found',
        );
        return reply.send(serializeObjective(objective));
    };

    private readonly createObjective: RouteContextHandler<undefined, undefined, CreateObjectiveBody> = async ({
        request,
        body,
        reply,
    }) => {
        const objective = await this.bus.execute(
            new CreateObjectiveCommand(body!),
            executionContextFromAuth(request.auth),
        );
        return sendCreated(reply, serializeObjective(objective));
    };

    private readonly updateObjective: RouteContextHandler<ObjectiveIdParams, undefined, UpdateObjectiveBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const objective = assertFound(
            await this.bus.execute(
                new UpdateObjectiveCommand(params!.id, body!),
                executionContextFromAuth(request.auth),
            ),
            'Objective not found',
        );
        return reply.send(serializeObjective(objective));
    };

    private readonly archiveObjective: RouteContextHandler<ObjectiveIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const objective = assertFound(
            await this.bus.execute(new ArchiveObjectiveCommand(params!.id), executionContextFromAuth(request.auth)),
            'Objective not found',
        );
        return reply.send(serializeObjective(objective));
    };

    private readonly markObjectiveAchieved: RouteContextHandler<ObjectiveIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const objective = await this.bus.execute(
            new MarkObjectiveAchievedCommand(params!.id),
            executionContextFromAuth(request.auth),
        );
        return reply.send(serializeObjective(objective));
    };
}
