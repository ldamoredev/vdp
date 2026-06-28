import { describe, expect, it, vi } from 'vitest';

import { Project } from '../../domain/Project';

describe('Project', () => {
    it('archives an active project and preserves direction fields', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 17, 12, 0, 0));
        const project = Project.fromSnapshot({
            id: 'project-1',
            kind: 'work',
            outcome: 'Ship the June report',
            nextAction: 'Draft the executive summary',
            focus: 'Reporting',
            client: 'Acme',
            hourlyRate: '120.00',
            rateCurrency: 'USD',
            status: 'active',
            archivedAt: null,
            createdAt: new Date(2026, 5, 1),
            updatedAt: new Date(2026, 5, 1),
        });

        project.archive();

        expect(project.status).toBe('archived');
        expect(project.archivedAt).toEqual(new Date(2026, 5, 17, 12, 0, 0));
        expect(project.toSnapshot()).toMatchObject({
            outcome: 'Ship the June report',
            nextAction: 'Draft the executive summary',
            focus: 'Reporting',
            client: 'Acme',
            hourlyRate: '120.00',
            rateCurrency: 'USD',
        });
        vi.useRealTimers();
    });

    it('updates and clears the hourly rate', () => {
        const project = Project.fromSnapshot({
            id: 'project-1',
            kind: 'work',
            outcome: 'Ship the June report',
            nextAction: 'Draft the executive summary',
            focus: 'Reporting',
            client: null,
            hourlyRate: null,
            rateCurrency: 'ARS',
            status: 'active',
            archivedAt: null,
            createdAt: new Date(2026, 5, 1),
            updatedAt: new Date(2026, 5, 1),
        });

        project.updateDirection({ hourlyRate: '45000.00', rateCurrency: 'ARS' });

        expect(project.toSnapshot()).toMatchObject({
            hourlyRate: '45000.00',
            rateCurrency: 'ARS',
        });

        project.updateDirection({ hourlyRate: null, rateCurrency: 'USD' });

        expect(project.toSnapshot()).toMatchObject({
            hourlyRate: null,
            rateCurrency: 'USD',
        });
    });

    it('rejects unknown kind and status values from persistence', () => {
        const base = {
            id: 'project-1',
            outcome: 'Outcome',
            nextAction: 'Next',
            focus: 'Focus',
            client: null,
            hourlyRate: null,
            rateCurrency: 'ARS',
            archivedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => Project.fromSnapshot({ ...base, kind: 'side', status: 'active' }))
            .toThrow('Invalid project kind');
        expect(() => Project.fromSnapshot({ ...base, kind: 'personal', status: 'deleted' }))
            .toThrow('Invalid project status');
    });
});
