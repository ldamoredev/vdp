import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DomainHttpError, NotFoundHttpError } from '../../../common/http/errors';
import { UpdateTaskCommand, UpdateTaskCommandHandler } from '../../app/UpdateTaskCommand';
import { createTask } from '../fakes/task-factory';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('UpdateTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('updates a pending task and schedules embedding for the authenticated user', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', title: 'Old title' })]);

        const task = await new UpdateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask)
            .handle(new UpdateTaskCommand('task-1', { title: 'New title', priority: 3 }), identity);

        expect(task).toMatchObject({ id: 'task-1', title: 'New title', priority: 3 });
        expect(ctx.executeInBackground).toHaveBeenCalledWith(userId, 'task-1');
    });

    it('returns null when the task does not exist', async () => {
        const task = await new UpdateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask)
            .handle(new UpdateTaskCommand('missing', { title: 'New title' }), identity);

        expect(task).toBeNull();
        expect(ctx.executeInBackground).not.toHaveBeenCalled();
    });

    it('rejects updates on non-pending tasks', async () => {
        ctx.tasks.seed([createTask({ id: 'task-1', status: 'done', completedAt: new Date() })]);

        await expect(
            new UpdateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask)
                .handle(new UpdateTaskCommand('task-1', { title: 'Nope' }), identity),
        ).rejects.toThrow(DomainHttpError);
    });

    it('assigns and unassigns a pending task to an owned project', async () => {
        const project = await ctx.projects.createProject(userId, {
            kind: 'work',
            outcome: 'Ship D3c',
            nextAction: 'Wire task selector',
            focus: 'Tasks and projects',
        });
        ctx.tasks.seed([createTask({ id: 'task-1', title: 'Old title' })]);
        const handler = new UpdateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask);

        const assigned = await handler.handle(
            new UpdateTaskCommand('task-1', { projectId: project.id }),
            identity,
        );
        const unassigned = await handler.handle(
            new UpdateTaskCommand('task-1', { projectId: null }),
            identity,
        );

        expect(assigned).toMatchObject({ id: 'task-1', projectId: project.id, boardStatus: 'backlog' });
        expect(unassigned).toMatchObject({ id: 'task-1', projectId: null, boardStatus: 'backlog' });
    });

    it('rejects project assignment when the project is not visible to the authenticated user', async () => {
        const otherProject = await ctx.projects.createProject('other-user', {
            kind: 'work',
            outcome: 'Private',
            nextAction: 'Nope',
            focus: 'Isolation',
        });
        ctx.tasks.seed([createTask({ id: 'task-1' })]);

        await expect(
            new UpdateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask)
                .handle(new UpdateTaskCommand('task-1', { projectId: otherProject.id }), identity),
        ).rejects.toThrow(NotFoundHttpError);
    });
});
