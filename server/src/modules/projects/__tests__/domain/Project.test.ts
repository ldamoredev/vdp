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
        });
        vi.useRealTimers();
    });

    it('rejects unknown kind and status values from persistence', () => {
        const base = {
            id: 'project-1',
            outcome: 'Outcome',
            nextAction: 'Next',
            focus: 'Focus',
            client: null,
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
