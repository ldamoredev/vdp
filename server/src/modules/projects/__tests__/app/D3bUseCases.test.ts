import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArchiveClientCommand, ArchiveClientCommandHandler } from '../../app/ArchiveClientCommand';
import { CreateClientCommand, CreateClientCommandHandler } from '../../app/CreateClientCommand';
import { GetProjectHoursReportQuery, GetProjectHoursReportQueryHandler } from '../../app/GetProjectHoursReportQuery';
import { ListClientsQuery, ListClientsQueryHandler } from '../../app/ListClientsQuery';
import { LogTimeEntryCommand, LogTimeEntryCommandHandler } from '../../app/LogTimeEntryCommand';
import { UpdateClientCommand, UpdateClientCommandHandler } from '../../app/UpdateClientCommand';
import { UpdateTimeEntryCommand, UpdateTimeEntryCommandHandler } from '../../app/UpdateTimeEntryCommand';
import { DeleteTimeEntryCommand, DeleteTimeEntryCommandHandler } from '../../app/DeleteTimeEntryCommand';
import { FakeClientRepository } from '../fakes/FakeClientRepository';
import { FakeProjectRepository } from '../fakes/FakeProjectRepository';
import { FakeTimeEntryRepository } from '../fakes/FakeTimeEntryRepository';
import { FakeTaskRepository } from '../../../tasks/__tests__/fakes/FakeTaskRepository';
import { createTask } from '../../../tasks/__tests__/fakes/task-factory';
import { identity, userId } from '../../../tasks/__tests__/app/task-cqbus-test-helpers';

describe('D3b use cases', () => {
    let clients: FakeClientRepository;
    let projects: FakeProjectRepository;
    let timeEntries: FakeTimeEntryRepository;
    let tasks: FakeTaskRepository;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 18, 10, 0, 0));
        clients = new FakeClientRepository();
        projects = new FakeProjectRepository();
        timeEntries = new FakeTimeEntryRepository();
        tasks = new FakeTaskRepository();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('manages clients for the authenticated user', async () => {
        const created = await new CreateClientCommandHandler(clients)
            .handle(new CreateClientCommand({ name: 'Acme' }), identity);
        const updated = await new UpdateClientCommandHandler(clients)
            .handle(new UpdateClientCommand(created.id, { name: 'Acme Corp' }), identity);
        const archived = await new ArchiveClientCommandHandler(clients)
            .handle(new ArchiveClientCommand(created.id), identity);
        const listed = await new ListClientsQueryHandler(clients).handle(new ListClientsQuery(), identity);

        expect(clients.lastCreateUserId).toBe(userId);
        expect(updated?.name).toBe('Acme Corp');
        expect(archived?.status).toBe('archived');
        expect(listed).toHaveLength(1);
    });

    it('logs, edits and deletes project time entries', async () => {
        const client = await clients.createClient(userId, { name: 'Acme' });
        const project = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'Ship report',
            nextAction: 'Log hours',
            focus: 'D3b',
            clientId: client.id,
        });
        tasks.seed([createTask({ id: 'task-1', projectId: project.id })]);
        const logHandler = new LogTimeEntryCommandHandler(projects, timeEntries, tasks);

        const logged = await logHandler.handle(new LogTimeEntryCommand({
            projectId: project.id,
            taskId: 'task-1',
            date: '2026-06-18',
            minutes: 90,
            note: 'Build report',
        }), identity);
        const updated = await new UpdateTimeEntryCommandHandler(projects, timeEntries, tasks)
            .handle(new UpdateTimeEntryCommand(logged.id, { minutes: 120, note: null }), identity);
        const deleted = await new DeleteTimeEntryCommandHandler(timeEntries)
            .handle(new DeleteTimeEntryCommand(logged.id), identity);

        expect(logged).toMatchObject({ projectId: project.id, taskId: 'task-1', minutes: 90 });
        expect(updated).toMatchObject({ id: logged.id, minutes: 120, note: null });
        expect(deleted).toBe(true);
    });

    it('reports hours grouped by client, project and week', async () => {
        const client = await clients.createClient(userId, { name: 'Acme' });
        const project = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'Ship report',
            nextAction: 'Log hours',
            focus: 'D3b',
            clientId: client.id,
        });
        await timeEntries.createTimeEntry(userId, {
            projectId: project.id,
            taskId: null,
            date: '2026-06-18',
            minutes: 60,
            note: null,
        });
        await timeEntries.createTimeEntry(userId, {
            projectId: project.id,
            taskId: null,
            date: '2026-06-19',
            minutes: 90,
            note: null,
        });

        const report = await new GetProjectHoursReportQueryHandler(timeEntries, projects, clients)
            .handle(new GetProjectHoursReportQuery({ fromDate: '2026-06-15', toDate: '2026-06-21' }), identity);

        expect(report.totalMinutes).toBe(150);
        expect(report.rows).toEqual([{
            clientId: client.id,
            clientName: 'Acme',
            projectId: project.id,
            projectOutcome: 'Ship report',
            weekStart: '2026-06-15',
            minutes: 150,
            expectedIncome: null,
        }]);
        expect(report.incomeTotals).toEqual([]);
    });

    it('reports expected income per project and currency without mixing currencies', async () => {
        const arsProject = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'ARS consulting',
            nextAction: 'Log hours',
            focus: 'D3d',
            hourlyRate: '10000.00',
            rateCurrency: 'ARS',
        });
        const usdProject = await projects.createProject(userId, {
            kind: 'work',
            outcome: 'USD consulting',
            nextAction: 'Log hours',
            focus: 'D3d',
            hourlyRate: '50.00',
            rateCurrency: 'USD',
        });
        await timeEntries.createTimeEntry(userId, {
            projectId: arsProject.id,
            taskId: null,
            date: '2026-06-18',
            minutes: 90,
            note: null,
        });
        await timeEntries.createTimeEntry(userId, {
            projectId: usdProject.id,
            taskId: null,
            date: '2026-06-18',
            minutes: 120,
            note: null,
        });
        await timeEntries.createTimeEntry(userId, {
            projectId: arsProject.id,
            taskId: null,
            date: '2026-06-19',
            minutes: 30,
            note: null,
        });

        const report = await new GetProjectHoursReportQueryHandler(timeEntries, projects, clients)
            .handle(new GetProjectHoursReportQuery({ fromDate: '2026-06-15', toDate: '2026-06-21' }), identity);

        expect(report.rows.map((row) => ({
            projectOutcome: row.projectOutcome,
            minutes: row.minutes,
            expectedIncome: row.expectedIncome,
        }))).toEqual([
            {
                projectOutcome: 'ARS consulting',
                minutes: 120,
                expectedIncome: { amount: '20000.00', currency: 'ARS' },
            },
            {
                projectOutcome: 'USD consulting',
                minutes: 120,
                expectedIncome: { amount: '100.00', currency: 'USD' },
            },
        ]);
        expect(report.incomeTotals).toEqual([
            { amount: '20000.00', currency: 'ARS' },
            { amount: '100.00', currency: 'USD' },
        ]);
    });
});
