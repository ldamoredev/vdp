import { createHabitSchema, habitIdParamsSchema, habitLogSchema } from '@vdp/shared';
import { z } from 'zod';

import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { ServiceResolver } from '../../../common/http/ServiceResolver';
import { RouteContextHandler } from '../../../common/http/routes';

import { ArchiveHabit } from '../../services/ArchiveHabit';
import { CompleteHabitDay } from '../../services/CompleteHabitDay';
import { CreateHabit } from '../../services/CreateHabit';
import { GetHabitsOverview } from '../../services/GetHabitsOverview';
import { UncompleteHabitDay } from '../../services/UncompleteHabitDay';

type HabitIdParams = z.infer<typeof habitIdParamsSchema>;
type CreateHabitBody = z.input<typeof createHabitSchema>;
type HabitLogBody = z.infer<typeof habitLogSchema>;

export class HealthController extends HttpController {
    readonly prefix = '/api/v1/health';

    constructor(private services: ServiceResolver) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/habits', {}, this.listHabits)
            .post('/habits', { body: createHabitSchema }, this.createHabit)
            .post('/habits/:id/complete', { params: habitIdParamsSchema, body: habitLogSchema.default({}) }, this.completeHabit)
            .post('/habits/:id/uncomplete', { params: habitIdParamsSchema, body: habitLogSchema.default({}) }, this.uncompleteHabit)
            .post('/habits/:id/archive', { params: habitIdParamsSchema }, this.archiveHabit);
    }

    private readonly listHabits: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const userId = request.auth.userId!;
        return reply.send(await this.services.get(GetHabitsOverview).execute(userId));
    };

    private readonly createHabit: RouteContextHandler<undefined, undefined, CreateHabitBody> = async ({
        request,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const habit = await this.services.get(CreateHabit).execute(userId, body!);
        const row = await this.services.get(GetHabitsOverview).buildRow(userId, habit);
        return sendCreated(reply, row);
    };

    private readonly completeHabit: RouteContextHandler<HabitIdParams, undefined, HabitLogBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(CompleteHabitDay).execute(userId, params!.id, body?.date);
        return reply.send(result);
    };

    private readonly uncompleteHabit: RouteContextHandler<HabitIdParams, undefined, HabitLogBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const result = await this.services.get(UncompleteHabitDay).execute(userId, params!.id, body?.date);
        return reply.send(result);
    };

    private readonly archiveHabit: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const habit = await this.services.get(ArchiveHabit).execute(userId, params!.id);
        return reply.send(habit.toSnapshot());
    };
}
