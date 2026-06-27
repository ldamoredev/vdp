import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundHttpError } from '../../../common/http/errors';
import { CreateTaskCommand, CreateTaskCommandHandler } from '../../app/CreateTaskCommand';
import { identity, setupTasksCQBusTest, type TasksCQBusTestContext, userId } from './task-cqbus-test-helpers';

describe('CreateTaskCommand', () => {
    let ctx: TasksCQBusTestContext;

    beforeEach(() => {
        ctx = setupTasksCQBusTest();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates a task and schedules embedding for the authenticated user', async () => {
        const result = await new CreateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask, ctx.findSimilarTasks)
            .handle(new CreateTaskCommand({
                title: 'Write report',
                description: 'Quarterly notes',
                priority: 1,
                scheduledDate: '2026-06-17',
                domain: 'work',
            }), identity);

        expect(result.task).toMatchObject({
            title: 'Write report',
            description: 'Quarterly notes',
            priority: 1,
            scheduledDate: '2026-06-17',
            domain: 'work',
        });
        expect(ctx.executeInBackground).toHaveBeenCalledWith(userId, result.task.id);
    });

    it('assigns a new task to an owned project in the backlog column', async () => {
        const project = await ctx.projects.createProject(userId, {
            kind: 'work',
            outcome: 'Ship D3c',
            nextAction: 'Wire task selector',
            focus: 'Tasks and projects',
        });

        const result = await new CreateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask, ctx.findSimilarTasks)
            .handle(new CreateTaskCommand({
                title: 'Write selector tests',
                projectId: project.id,
            }), identity);

        expect(result.task).toMatchObject({
            title: 'Write selector tests',
            projectId: project.id,
            boardStatus: 'backlog',
        });
    });

    it('keeps a task in backlog when no project is assigned', async () => {
        const result = await new CreateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask, ctx.findSimilarTasks)
            .handle(new CreateTaskCommand({
                title: 'Standalone task',
                projectId: null,
                boardStatus: 'doing',
            }), identity);

        expect(result.task).toMatchObject({
            title: 'Standalone task',
            projectId: null,
            boardStatus: 'backlog',
        });
    });

    it('rejects project assignment when the project is not visible to the authenticated user', async () => {
        const otherProject = await ctx.projects.createProject('other-user', {
            kind: 'work',
            outcome: 'Private',
            nextAction: 'Nope',
            focus: 'Isolation',
        });

        await expect(
            new CreateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask, ctx.findSimilarTasks)
                .handle(new CreateTaskCommand({
                    title: 'Cross-user assignment',
                    projectId: otherProject.id,
                }), identity),
        ).rejects.toThrow(NotFoundHttpError);
    });

    it('returns similar tasks when duplicate checking is requested', async () => {
        ctx.findSimilar.mockResolvedValueOnce([
            {
                taskId: 'similar-1',
                content: 'Write report',
                similarity: 0.82,
                matchPercent: 82,
            },
        ]);

        const result = await new CreateTaskCommandHandler(ctx.tasks, ctx.projects, ctx.embedTask, ctx.findSimilarTasks)
            .handle(new CreateTaskCommand({ title: 'Write report' }, true), identity);

        expect(ctx.findSimilar).toHaveBeenCalledWith(userId, 'Write report', 3, 0.6);
        expect(result.similarTasks).toEqual([
            {
                taskId: 'similar-1',
                content: 'Write report',
                similarity: 0.82,
                matchPercent: 82,
            },
        ]);
    });
});
