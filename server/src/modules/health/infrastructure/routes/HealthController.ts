import {
    counterRelapseSchema,
    createCounterSchema,
    createGoalSchema,
    createHabitSchema,
    graduateGoalSchema,
    habitIdParamsSchema,
    habitLogSchema,
    moodCheckInSchema,
    moodCheckInsQuerySchema,
    weightEntrySchema,
    weightTrendQuerySchema,
} from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { RouteContextHandler } from '../../../common/http/routes';
import { ArchiveCounterCommand } from '../../app/ArchiveCounterCommand';
import { ArchiveHabitCommand } from '../../app/ArchiveHabitCommand';
import { CompleteGoalCommand } from '../../app/CompleteGoalCommand';
import { CompleteHabitDayCommand } from '../../app/CompleteHabitDayCommand';
import { CreateCounterCommand } from '../../app/CreateCounterCommand';
import { CreateGoalCommand } from '../../app/CreateGoalCommand';
import { CreateHabitCommand } from '../../app/CreateHabitCommand';
import { DropGoalCommand } from '../../app/DropGoalCommand';
import { GetCountersOverviewQuery } from '../../app/GetCountersOverviewQuery';
import { GetGoalsOverviewQuery } from '../../app/GetGoalsOverviewQuery';
import { GetHabitsOverviewQuery } from '../../app/GetHabitsOverviewQuery';
import { GetMoodCheckInsQuery } from '../../app/GetMoodCheckInsQuery';
import { GetWeightTrendQuery } from '../../app/GetWeightTrendQuery';
import { GraduateGoalCommand } from '../../app/GraduateGoalCommand';
import { RelapseCounterCommand } from '../../app/RelapseCounterCommand';
import { SaveMoodCheckInCommand } from '../../app/SaveMoodCheckInCommand';
import { SaveWeightEntryCommand } from '../../app/SaveWeightEntryCommand';
import { UncompleteHabitDayCommand } from '../../app/UncompleteHabitDayCommand';

type HabitIdParams = z.infer<typeof habitIdParamsSchema>;
type CreateHabitBody = z.input<typeof createHabitSchema>;
type HabitLogBody = z.infer<typeof habitLogSchema>;
type CreateCounterBody = z.input<typeof createCounterSchema>;
type CounterRelapseBody = z.infer<typeof counterRelapseSchema>;
type CreateGoalBody = z.input<typeof createGoalSchema>;
type GraduateGoalBody = z.input<typeof graduateGoalSchema>;
type MoodCheckInsQuery = z.infer<typeof moodCheckInsQuerySchema>;
type MoodCheckInBody = z.input<typeof moodCheckInSchema>;
type WeightTrendQuery = z.infer<typeof weightTrendQuerySchema>;
type WeightEntryBody = z.input<typeof weightEntrySchema>;

export class HealthController extends HttpController {
    readonly prefix = '/api/v1/health';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/habits', {}, this.listHabits)
            .post('/habits', { body: createHabitSchema }, this.createHabit)
            .post('/habits/:id/complete', { params: habitIdParamsSchema, body: habitLogSchema.default({}) }, this.completeHabit)
            .post('/habits/:id/uncomplete', { params: habitIdParamsSchema, body: habitLogSchema.default({}) }, this.uncompleteHabit)
            .post('/habits/:id/archive', { params: habitIdParamsSchema }, this.archiveHabit)
            .get('/counters', {}, this.listCounters)
            .post('/counters', { body: createCounterSchema }, this.createCounter)
            .post('/counters/:id/relapse', { params: habitIdParamsSchema, body: counterRelapseSchema.default({}) }, this.relapseCounter)
            .post('/counters/:id/archive', { params: habitIdParamsSchema }, this.archiveCounter)
            .get('/goals', {}, this.listGoals)
            .post('/goals', { body: createGoalSchema }, this.createGoal)
            .post('/goals/:id/complete', { params: habitIdParamsSchema }, this.completeGoal)
            .post('/goals/:id/drop', { params: habitIdParamsSchema }, this.dropGoal)
            .post('/goals/:id/graduate', { params: habitIdParamsSchema, body: graduateGoalSchema }, this.graduateGoal)
            .get('/mood-check-ins', { query: moodCheckInsQuerySchema }, this.listMoodCheckIns)
            .put('/mood-check-ins', { body: moodCheckInSchema }, this.saveMoodCheckIn)
            .get('/weight', { query: weightTrendQuerySchema }, this.getWeightTrend)
            .put('/weight', { body: weightEntrySchema }, this.saveWeightEntry);
    }

    private readonly getWeightTrend: RouteContextHandler<undefined, WeightTrendQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new GetWeightTrendQuery(query?.days),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly saveWeightEntry: RouteContextHandler<undefined, undefined, WeightEntryBody> = async ({
        request,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new SaveWeightEntryCommand(body!),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly listMoodCheckIns: RouteContextHandler<undefined, MoodCheckInsQuery, undefined> = async ({
        request,
        query,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new GetMoodCheckInsQuery(query?.days),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly saveMoodCheckIn: RouteContextHandler<undefined, undefined, MoodCheckInBody> = async ({
        request,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new SaveMoodCheckInCommand(body!),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly listGoals: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(await this.bus.execute(new GetGoalsOverviewQuery(), executionContextFromAuth(request.auth)));
    };

    private readonly createGoal: RouteContextHandler<undefined, undefined, CreateGoalBody> = async ({
        request,
        body,
        reply,
    }) => {
        const goal = await this.bus.execute(new CreateGoalCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, goal);
    };

    private readonly completeGoal: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new CompleteGoalCommand(params!.id), executionContextFromAuth(request.auth)),
        );
    };

    private readonly dropGoal: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new DropGoalCommand(params!.id), executionContextFromAuth(request.auth)),
        );
    };

    private readonly graduateGoal: RouteContextHandler<HabitIdParams, undefined, GraduateGoalBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new GraduateGoalCommand(params!.id, body!), executionContextFromAuth(request.auth)),
        );
    };

    private readonly listCounters: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(await this.bus.execute(new GetCountersOverviewQuery(), executionContextFromAuth(request.auth)));
    };

    private readonly createCounter: RouteContextHandler<undefined, undefined, CreateCounterBody> = async ({
        request,
        body,
        reply,
    }) => {
        const counter = await this.bus.execute(new CreateCounterCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, counter);
    };

    private readonly relapseCounter: RouteContextHandler<HabitIdParams, undefined, CounterRelapseBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new RelapseCounterCommand(params!.id, body?.date),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly archiveCounter: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new ArchiveCounterCommand(params!.id), executionContextFromAuth(request.auth)),
        );
    };

    private readonly listHabits: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(await this.bus.execute(new GetHabitsOverviewQuery(), executionContextFromAuth(request.auth)));
    };

    private readonly createHabit: RouteContextHandler<undefined, undefined, CreateHabitBody> = async ({
        request,
        body,
        reply,
    }) => {
        const row = await this.bus.execute(new CreateHabitCommand(body!), executionContextFromAuth(request.auth));
        return sendCreated(reply, row);
    };

    private readonly completeHabit: RouteContextHandler<HabitIdParams, undefined, HabitLogBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new CompleteHabitDayCommand(params!.id, body?.date),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly uncompleteHabit: RouteContextHandler<HabitIdParams, undefined, HabitLogBody> = async ({
        request,
        params,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new UncompleteHabitDayCommand(params!.id, body?.date),
                executionContextFromAuth(request.auth),
            ),
        );
    };

    private readonly archiveHabit: RouteContextHandler<HabitIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new ArchiveHabitCommand(params!.id), executionContextFromAuth(request.auth)),
        );
    };
}
