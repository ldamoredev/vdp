import { CQBus } from '@nbottarini/cqbus';
import { beforeEach, describe, expect, it } from 'vitest';

import { AgentTool } from '../../../common/base/agents/BaseAgent';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { GetTasksQuery, GetTasksQueryHandler } from '../../../tasks/app/GetTasksQuery';
import { FakeTaskRepository } from '../../../tasks/__tests__/fakes/FakeTaskRepository';
import { GetProjectQuery, GetProjectQueryHandler } from '../../app/GetProjectQuery';
import { GetProjectHoursReportQuery, GetProjectHoursReportQueryHandler } from '../../app/GetProjectHoursReportQuery';
import { ListProjectsQuery, ListProjectsQueryHandler } from '../../app/ListProjectsQuery';
import { ListTimeEntriesQuery, ListTimeEntriesQueryHandler } from '../../app/ListTimeEntriesQuery';
import { FakeClientRepository } from '../fakes/FakeClientRepository';
import { FakeProjectRepository } from '../fakes/FakeProjectRepository';
import { FakeTimeEntryRepository } from '../fakes/FakeTimeEntryRepository';
import { ProjectsTools } from '../../infrastructure/agent/tools';

const OWNER = 'user-a';
const OTHER = 'user-b';

function buildHarness() {
    const projects = new FakeProjectRepository();
    const tasks = new FakeTaskRepository();
    const timeEntries = new FakeTimeEntryRepository();
    const clients = new FakeClientRepository();
    const bus = new CQBus();
    bus.registerHandler(ListProjectsQuery, () => new ListProjectsQueryHandler(projects));
    bus.registerHandler(GetProjectQuery, () => new GetProjectQueryHandler(projects));
    bus.registerHandler(GetTasksQuery, () => new GetTasksQueryHandler(tasks));
    bus.registerHandler(ListTimeEntriesQuery, () => new ListTimeEntriesQueryHandler(timeEntries));
    bus.registerHandler(GetProjectHoursReportQuery, () =>
        new GetProjectHoursReportQueryHandler(timeEntries, projects, clients),
    );

    const authContextStorage = new AuthContextStorage();
    const tools = ProjectsTools.createProjectsTools(bus, authContextStorage);
    const tool = (name: string): AgentTool => tools.find((candidate) => candidate.name === name)!;

    return { projects, tasks, timeEntries, authContextStorage, tool };
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

describe('ProjectsTools', () => {
    let harness: ReturnType<typeof buildHarness>;

    beforeEach(() => {
        harness = buildHarness();
    });

    it('lists only the current owner projects and applies status and kind filters', async () => {
        const { projects, authContextStorage, tool } = harness;
        await projects.createProject(OWNER, {
            kind: 'work',
            outcome: 'Ship VDP',
            nextAction: 'Review roadmap',
            focus: 'Projects agent',
            hourlyRate: '25.00',
            rateCurrency: 'USD',
        });
        const archived = await projects.createProject(OWNER, {
            kind: 'personal',
            outcome: 'Move house',
            nextAction: 'Call movers',
            focus: 'Budget',
        });
        archived.archive();
        await projects.save(OWNER, archived);
        await projects.createProject(OTHER, {
            kind: 'work',
            outcome: 'Private project',
            nextAction: 'Secret',
            focus: 'Other owner',
        });
        authenticate(authContextStorage, OWNER);

        const active = JSON.parse(await tool('list_projects').execute({ userId: OTHER }));
        const archivedPersonal = JSON.parse(
            await tool('list_projects').execute({ status: 'archived', kind: 'personal' }),
        );

        expect(active.projects).toEqual([
            expect.objectContaining({
                outcome: 'Ship VDP',
                status: 'active',
                kind: 'work',
                hourlyRate: '25.00',
                rateCurrency: 'USD',
            }),
        ]);
        expect(archivedPersonal.projects).toEqual([
            expect.objectContaining({ outcome: 'Move house', status: 'archived', kind: 'personal' }),
        ]);
    });

    it('returns project direction and groups its existing Tasks by board column', async () => {
        const { projects, tasks, authContextStorage, tool } = harness;
        const project = await projects.createProject(OWNER, {
            kind: 'work',
            outcome: 'Ship VDP',
            nextAction: 'Review roadmap',
            focus: 'Projects agent',
        });
        await tasks.createTask(OWNER, {
            title: 'Define tools',
            projectId: project.id,
            boardStatus: 'backlog',
            priority: 1,
        });
        await tasks.createTask(OWNER, {
            title: 'Wire chat',
            projectId: project.id,
            boardStatus: 'doing',
            priority: 2,
        });
        authenticate(authContextStorage, OWNER);

        const result = JSON.parse(await tool('get_project_board').execute({ projectId: project.id }));

        expect(result.project).toMatchObject({
            id: project.id,
            outcome: 'Ship VDP',
            nextAction: 'Review roadmap',
            focus: 'Projects agent',
        });
        expect(result.board.backlog).toEqual([
            expect.objectContaining({ title: 'Define tools', priority: 1, status: 'pending' }),
        ]);
        expect(result.board.next).toEqual([]);
        expect(result.board.doing).toEqual([
            expect.objectContaining({ title: 'Wire chat', priority: 2, status: 'pending' }),
        ]);
        expect(result.board.done).toEqual([]);
    });

    it('does not expose another owner project board', async () => {
        const { projects, authContextStorage, tool } = harness;
        const project = await projects.createProject(OWNER, {
            kind: 'work',
            outcome: 'Private project',
            nextAction: 'Secret',
            focus: 'Owner only',
        });
        authenticate(authContextStorage, OTHER);

        const result = JSON.parse(await tool('get_project_board').execute({ projectId: project.id }));

        expect(result).toEqual({ error: 'Project not found' });
    });

    it('lists dated time entries enriched with owner-visible project direction', async () => {
        const { projects, timeEntries, authContextStorage, tool } = harness;
        const project = await projects.createProject(OWNER, {
            kind: 'work',
            outcome: 'Ship VDP',
            nextAction: 'Review roadmap',
            focus: 'Projects agent',
        });
        const privateProject = await projects.createProject(OTHER, {
            kind: 'work',
            outcome: 'Private project',
            nextAction: 'Secret',
            focus: 'Other owner',
        });
        await timeEntries.createTimeEntry(OWNER, {
            projectId: project.id,
            date: '2026-07-10',
            minutes: 90,
            note: 'Implemented tools',
        });
        await timeEntries.createTimeEntry(OTHER, {
            projectId: privateProject.id,
            date: '2026-07-10',
            minutes: 240,
            note: 'Must stay private',
        });
        authenticate(authContextStorage, OWNER);

        const result = JSON.parse(
            await tool('list_project_time_entries').execute({
                fromDate: '2026-07-07',
                toDate: '2026-07-13',
            }),
        );

        expect(result.entries).toEqual([
            expect.objectContaining({
                projectId: project.id,
                projectOutcome: 'Ship VDP',
                date: '2026-07-10',
                minutes: 90,
                note: 'Implemented tools',
            }),
        ]);
    });

    it('returns hours and expected income without combining currencies', async () => {
        const { projects, timeEntries, authContextStorage, tool } = harness;
        const usdProject = await projects.createProject(OWNER, {
            kind: 'work',
            outcome: 'USD client',
            nextAction: 'Deliver feature',
            focus: 'Release',
            hourlyRate: '30.00',
            rateCurrency: 'USD',
        });
        const arsProject = await projects.createProject(OWNER, {
            kind: 'work',
            outcome: 'ARS client',
            nextAction: 'Send report',
            focus: 'Reporting',
            hourlyRate: '12000.00',
            rateCurrency: 'ARS',
        });
        await timeEntries.createTimeEntry(OWNER, {
            projectId: usdProject.id,
            date: '2026-07-10',
            minutes: 120,
        });
        await timeEntries.createTimeEntry(OWNER, {
            projectId: arsProject.id,
            date: '2026-07-11',
            minutes: 60,
        });
        authenticate(authContextStorage, OWNER);

        const report = JSON.parse(
            await tool('get_project_hours_report').execute({
                fromDate: '2026-07-07',
                toDate: '2026-07-13',
            }),
        );

        expect(report.totalMinutes).toBe(180);
        expect(report.incomeTotals).toEqual([
            { amount: '12000.00', currency: 'ARS' },
            { amount: '60.00', currency: 'USD' },
        ]);
    });

    it('rejects invalid and inverted date ranges before querying time data', async () => {
        const { authContextStorage, tool } = harness;
        authenticate(authContextStorage, OWNER);

        const invalid = JSON.parse(
            await tool('list_project_time_entries').execute({ fromDate: '10/07/2026', toDate: '2026-07-13' }),
        );
        const inverted = JSON.parse(
            await tool('get_project_hours_report').execute({ fromDate: '2026-07-14', toDate: '2026-07-13' }),
        );

        expect(invalid.error).toContain('Invalid fromDate');
        expect(inverted.error).toBe('fromDate must be on or before toDate');
    });
});
