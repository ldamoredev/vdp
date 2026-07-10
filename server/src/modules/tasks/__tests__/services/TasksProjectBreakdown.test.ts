import { CQBus } from '@nbottarini/cqbus';
import { beforeEach, describe, expect, it } from 'vitest';

import { AgentTool } from '../../../common/base/agents/BaseAgent';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { GetProjectQuery, GetProjectQueryHandler } from '../../../projects/app/GetProjectQuery';
import { FakeProjectRepository } from '../../../projects/__tests__/fakes/FakeProjectRepository';
import { CreateTaskCommand, CreateTaskCommandHandler } from '../../app/CreateTaskCommand';
import { GetTasksQuery, GetTasksQueryHandler } from '../../app/GetTasksQuery';
import { EmbedTask } from '../../services/EmbedTask';
import { FindSimilarTasks } from '../../services/FindSimilarTasks';
import { TasksTools } from '../../infrastructure/agent/tools.js';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';

const OWNER = 'user-a';
const OTHER = 'user-b';

function buildHarness() {
    const tasks = new FakeTaskRepository();
    const projects = new FakeProjectRepository();
    const embeddings = new FakeTaskEmbeddingRepository();
    const embeddingProvider = new FakeEmbeddingProvider();
    const embedTask = new EmbedTask(tasks, new FakeTaskNoteRepository(), embeddings, embeddingProvider);
    const findSimilarTasks = new FindSimilarTasks(embeddings, embeddingProvider);

    const bus = new CQBus();
    bus.registerHandler(GetProjectQuery, () => new GetProjectQueryHandler(projects));
    bus.registerHandler(GetTasksQuery, () => new GetTasksQueryHandler(tasks));
    bus.registerHandler(CreateTaskCommand, () =>
        new CreateTaskCommandHandler(tasks, projects, embedTask, findSimilarTasks),
    );

    const authContextStorage = new AuthContextStorage();
    const tools = TasksTools.createTasksTools(bus, authContextStorage);
    const tool = (name: string): AgentTool => tools.find((t) => t.name === name)!;

    return { tasks, projects, authContextStorage, tool };
}

function authenticate(authContextStorage: AuthContextStorage, userId: string) {
    authContextStorage.setAuthContext({
        isAuthenticated: true,
        userId,
        sessionId: 'session',
        role: 'user',
        email: `${userId}@example.com`,
        displayName: userId,
    });
}

function seedProject(projects: FakeProjectRepository, userId: string) {
    return projects.createProject(userId, {
        kind: 'work',
        outcome: 'Lanzar la v1 del sitio',
        nextAction: 'Escribir el plan',
        focus: 'MVP navegable',
    });
}

describe('Tasks agent — project breakdown', () => {
    let harness: ReturnType<typeof buildHarness>;

    beforeEach(() => {
        harness = buildHarness();
    });

    describe('get_project_context', () => {
        it('returns the project direction and its existing tasks for the owner', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            await tasks.createTask(OWNER, { title: 'Comprar dominio', projectId: project.id, boardStatus: 'backlog' });
            authenticate(authContextStorage, OWNER);

            const result = JSON.parse(await tool('get_project_context').execute({ projectId: project.id }));

            expect(result.project).toMatchObject({
                id: project.id,
                outcome: 'Lanzar la v1 del sitio',
                nextAction: 'Escribir el plan',
                focus: 'MVP navegable',
            });
            expect(result.existingTasks).toEqual([
                expect.objectContaining({ title: 'Comprar dominio', boardStatus: 'backlog' }),
            ]);
        });

        it('returns an error for a project the user does not own', async () => {
            const { projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OTHER);

            const result = JSON.parse(await tool('get_project_context').execute({ projectId: project.id }));

            expect(result.error).toBeTruthy();
            expect(result.project).toBeUndefined();
        });
    });

    describe('propose_project_tasks', () => {
        it('returns a normalized proposal without creating tasks', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OWNER);

            const result = JSON.parse(
                await tool('propose_project_tasks').execute({
                    projectId: project.id,
                    tasks: [
                        { title: '  Comprar dominio  ' },
                        { title: 'Diseñar landing', priority: 3 },
                        { title: 'Publicar primera versión', priority: 1 },
                    ],
                }),
            );

            expect(result).toEqual({
                projectId: project.id,
                tasks: [
                    { title: 'Comprar dominio', priority: 2 },
                    { title: 'Diseñar landing', priority: 3 },
                    { title: 'Publicar primera versión', priority: 1 },
                ],
            });
            expect(tasks.size).toBe(0);
        });

        it('rejects proposals outside the 3 to 8 draft range', async () => {
            const { projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OWNER);

            const tooShort = JSON.parse(
                await tool('propose_project_tasks').execute({
                    projectId: project.id,
                    tasks: [{ title: 'Uno' }, { title: 'Dos' }],
                }),
            );
            const tooLong = JSON.parse(
                await tool('propose_project_tasks').execute({
                    projectId: project.id,
                    tasks: Array.from({ length: 9 }, (_, index) => ({ title: `Tarea ${index + 1}` })),
                }),
            );

            expect(tooShort.error).toContain('3 and 8');
            expect(tooLong.error).toContain('3 and 8');
        });

        it('does not expose a proposal for another user\'s project', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OTHER);

            const result = JSON.parse(
                await tool('propose_project_tasks').execute({
                    projectId: project.id,
                    tasks: [{ title: 'Uno' }, { title: 'Dos' }, { title: 'Tres' }],
                }),
            );

            expect(result.error).toBeTruthy();
            expect(result.tasks).toBeUndefined();
            expect(tasks.size).toBe(0);
        });
    });

    describe('create_project_tasks', () => {
        it('creates the drafts into the project backlog and returns them', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OWNER);

            const result = JSON.parse(
                await tool('create_project_tasks').execute({
                    projectId: project.id,
                    tasks: [{ title: 'Comprar dominio' }, { title: 'Diseñar landing', priority: 3 }],
                }),
            );

            expect(result.count).toBe(2);
            expect(result.created).toHaveLength(2);

            const persisted = await tasks.listTasks(OWNER, { projectId: project.id });
            expect(persisted.total).toBe(2);
            for (const task of persisted.tasks) {
                expect(task.projectId).toBe(project.id);
                expect(task.boardStatus).toBe('backlog');
            }
            expect(persisted.tasks.find((t) => t.title === 'Diseñar landing')?.priority).toBe(3);
        });

        it('rejects an empty task list without creating anything', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OWNER);

            const result = JSON.parse(
                await tool('create_project_tasks').execute({ projectId: project.id, tasks: [] }),
            );

            expect(result.error).toBeTruthy();
            expect(tasks.size).toBe(0);
        });

        it('rejects more than 8 drafts to keep the confirmation meaningful', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OWNER);

            const drafts = Array.from({ length: 9 }, (_, i) => ({ title: `Tarea ${i + 1}` }));
            const result = JSON.parse(
                await tool('create_project_tasks').execute({ projectId: project.id, tasks: drafts }),
            );

            expect(result.error).toBeTruthy();
            expect(tasks.size).toBe(0);
        });

        it('does not create tasks into another user\'s project', async () => {
            const { tasks, projects, authContextStorage, tool } = harness;
            const project = await seedProject(projects, OWNER);
            authenticate(authContextStorage, OTHER);

            const result = JSON.parse(
                await tool('create_project_tasks').execute({
                    projectId: project.id,
                    tasks: [{ title: 'Tarea intrusa' }],
                }),
            );

            expect(result.error).toBeTruthy();
            expect(tasks.size).toBe(0);
        });
    });
});
