import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AssignTaskToProjectCommand, AssignTaskToProjectCommandHandler } from '../../app/AssignTaskToProjectCommand';
import { ArchiveProjectCommand, ArchiveProjectCommandHandler } from '../../app/ArchiveProjectCommand';
import { CreateProjectCommand, CreateProjectCommandHandler } from '../../app/CreateProjectCommand';
import { GetProjectQuery, GetProjectQueryHandler } from '../../app/GetProjectQuery';
import { ListProjectsQuery, ListProjectsQueryHandler } from '../../app/ListProjectsQuery';
import { UpdateProjectCommand, UpdateProjectCommandHandler } from '../../app/UpdateProjectCommand';
import { NotFoundHttpError } from '../../../common/http/errors';
import { FakeClientRepository } from '../fakes/FakeClientRepository';
import { FakeProjectRepository } from '../fakes/FakeProjectRepository';
import { FakeTaskRepository } from '../../../tasks/__tests__/fakes/FakeTaskRepository';
import { createTask } from '../../../tasks/__tests__/fakes/task-factory';
import { identity, userId } from '../../../tasks/__tests__/app/task-cqbus-test-helpers';

describe('Project use cases', () => {
    let projects: FakeProjectRepository;
    let clients: FakeClientRepository;
    let tasks: FakeTaskRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 17, 12, 0, 0));
        projects = new FakeProjectRepository();
        clients = new FakeClientRepository();
        tasks = new FakeTaskRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('creates, lists and reads projects for the authenticated user', async () => {
        const client = await clients.createClient(userId, { name: 'Acme' });
        const created = await new CreateProjectCommandHandler(projects, clients)
            .handle(new CreateProjectCommand({
                kind: 'work',
                outcome: 'Launch reporting',
                nextAction: 'Map current spreadsheet',
                focus: 'Make the first report useful',
                clientId: client.id,
                hourlyRate: '80.00',
                rateCurrency: 'USD',
            }), identity);

        const listed = await new ListProjectsQueryHandler(projects).handle(new ListProjectsQuery(), identity);
        const read = await new GetProjectQueryHandler(projects).handle(new GetProjectQuery(created.id), identity);

        expect(projects.lastCreateUserId).toBe(userId);
        expect(created.clientId).toBe(client.id);
        expect(created.hourlyRate).toBe('80.00');
        expect(created.rateCurrency).toBe('USD');
        expect(listed).toEqual([created]);
        expect(read).toEqual(created);
    });

    it('updates direction fields without changing ownership', async () => {
        const project = await projects.createProject(userId, {
            kind: 'personal',
            outcome: 'Move home',
            nextAction: 'Call movers',
            focus: 'Logistics',
        });

        const updated = await new UpdateProjectCommandHandler(projects, clients)
            .handle(new UpdateProjectCommand(project.id, {
                outcome: 'Move without chaos',
                nextAction: 'Confirm truck',
                focus: 'Execution',
                client: null,
                hourlyRate: '45000.00',
                rateCurrency: 'ARS',
            }), identity);

        expect(updated).toMatchObject({
            id: project.id,
            outcome: 'Move without chaos',
            nextAction: 'Confirm truck',
            focus: 'Execution',
            client: null,
            hourlyRate: '45000.00',
            rateCurrency: 'ARS',
        });
    });

    it('archives a project', async () => {
        const project = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'Ship integration',
            nextAction: 'Create adapter',
            focus: 'Backend',
        });

        const archived = await new ArchiveProjectCommandHandler(projects)
            .handle(new ArchiveProjectCommand(project.id), identity);

        expect(archived?.status).toBe('archived');
        expect(archived?.archivedAt).toEqual(new Date(2026, 5, 17, 12, 0, 0));
    });

    it('assigns and unassigns an existing task to an owned project', async () => {
        const project = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'Ship board',
            nextAction: 'Wire presenter',
            focus: 'D3a',
        });
        tasks.seed([createTask({ id: 'task-1' })]);
        const handler = new AssignTaskToProjectCommandHandler(projects, tasks);

        const assigned = await handler.handle(
            new AssignTaskToProjectCommand(project.id, 'task-1', { boardStatus: 'doing' }),
            identity,
        );
        const unassigned = await handler.handle(
            new AssignTaskToProjectCommand(project.id, 'task-1', { boardStatus: null }),
            identity,
        );

        expect(assigned).toMatchObject({ id: 'task-1', projectId: project.id, boardStatus: 'doing' });
        expect(unassigned).toMatchObject({ id: 'task-1', projectId: null, boardStatus: 'backlog' });
    });

    it('rejects task assignment when the project is not visible to the user', async () => {
        tasks.seed([createTask({ id: 'task-1' })]);

        await expect(
            new AssignTaskToProjectCommandHandler(projects, tasks)
                .handle(new AssignTaskToProjectCommand('missing-project', 'task-1'), identity),
        ).rejects.toThrow(NotFoundHttpError);
    });
});
