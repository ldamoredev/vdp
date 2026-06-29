import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { NotFoundHttpError } from '../../../common/http/errors';
import { ArchiveObjectiveCommand, ArchiveObjectiveCommandHandler } from '../../app/ArchiveObjectiveCommand';
import { CreateObjectiveCommand, CreateObjectiveCommandHandler } from '../../app/CreateObjectiveCommand';
import { GetObjectiveQuery, GetObjectiveQueryHandler } from '../../app/GetObjectiveQuery';
import { ListObjectivesQuery, ListObjectivesQueryHandler } from '../../app/ListObjectivesQuery';
import { MarkObjectiveAchievedCommand, MarkObjectiveAchievedCommandHandler } from '../../app/MarkObjectiveAchievedCommand';
import { UpdateObjectiveCommand, UpdateObjectiveCommandHandler } from '../../app/UpdateObjectiveCommand';
import { FakeObjectiveRepository } from '../fakes/FakeObjectiveRepository';

const userId = 'user-1';
const otherUserId = 'user-2';
const identity = new UserIdentity(userId, 'test@example.com', 'Test', ['user']);
const otherIdentity = new UserIdentity(otherUserId, 'other@example.com', 'Other', ['user']);

describe('Objective use cases', () => {
    let objectives: FakeObjectiveRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-28T12:00:00.000Z'));
        objectives = new FakeObjectiveRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates, lists and reads objectives for the authenticated user', async () => {
        const created = await new CreateObjectiveCommandHandler(objectives)
            .handle(new CreateObjectiveCommand({
                title: '120 horas estratégicas',
                periodStart: '2026-07-01',
                periodEnd: '2026-09-30',
                metricSource: 'projects_hours',
                target: 120,
                unit: 'h',
            }), identity);

        const listed = await new ListObjectivesQueryHandler(objectives)
            .handle(new ListObjectivesQuery(), identity);
        const read = await new GetObjectiveQueryHandler(objectives)
            .handle(new GetObjectiveQuery(created.id), identity);

        expect(objectives.lastCreateUserId).toBe(userId);
        expect(created).toMatchObject({
            title: '120 horas estratégicas',
            metricSource: 'projects_hours',
            manualValue: null,
            status: 'active',
        });
        expect(listed).toEqual([created]);
        expect(read).toEqual(created);
    });

    it('updates objective fields without changing ownership', async () => {
        const objective = await objectives.createObjective(userId, {
            title: 'Manual score',
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 2,
        });

        const updated = await new UpdateObjectiveCommandHandler(objectives)
            .handle(new UpdateObjectiveCommand(objective.id, {
                title: 'Manual score updated',
                target: 20,
                manualValue: 8,
            }), identity);

        expect(updated).toMatchObject({
            id: objective.id,
            title: 'Manual score updated',
            target: 20,
            manualValue: 8,
            ownerUserId: userId,
        });
    });

    it('archives an objective', async () => {
        const objective = await objectives.createObjective(userId, {
            title: 'Archive me',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'projects_hours',
            target: 80,
            unit: 'h',
        });

        const archived = await new ArchiveObjectiveCommandHandler(objectives)
            .handle(new ArchiveObjectiveCommand(objective.id), identity);

        expect(archived).toMatchObject({
            id: objective.id,
            status: 'archived',
            archivedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
    });

    it('marks an objective achieved idempotently', async () => {
        const objective = await objectives.createObjective(userId, {
            title: 'Reach target',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 10,
        });
        const handler = new MarkObjectiveAchievedCommandHandler(objectives);

        const achieved = await handler.handle(new MarkObjectiveAchievedCommand(objective.id), identity);
        const achievedAgain = await handler.handle(new MarkObjectiveAchievedCommand(objective.id), identity);

        expect(achieved).toMatchObject({
            id: objective.id,
            status: 'achieved',
            achievedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
        expect(achievedAgain.toSnapshot()).toMatchObject({
            status: 'achieved',
            achievedAt: new Date('2026-06-28T12:00:00.000Z'),
        });
    });

    it('does not expose another users objectives', async () => {
        const objective = await objectives.createObjective(userId, {
            title: 'Private objective',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 3,
        });

        const read = await new GetObjectiveQueryHandler(objectives)
            .handle(new GetObjectiveQuery(objective.id), otherIdentity);
        const listed = await new ListObjectivesQueryHandler(objectives)
            .handle(new ListObjectivesQuery(), otherIdentity);

        expect(read).toBeNull();
        expect(listed).toEqual([]);
    });

    it('does not mark another users objective achieved', async () => {
        const objective = await objectives.createObjective(userId, {
            title: 'Private target',
            periodStart: '2026-07-01',
            periodEnd: '2026-09-30',
            metricSource: 'manual',
            target: 10,
            unit: 'puntos',
            manualValue: 10,
        });

        await expect(
            new MarkObjectiveAchievedCommandHandler(objectives)
                .handle(new MarkObjectiveAchievedCommand(objective.id), otherIdentity),
        ).rejects.toBeInstanceOf(NotFoundHttpError);
    });
});
