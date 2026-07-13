import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildProjectsSystemPrompt } from '../../infrastructure/agent/system-prompt';

describe('buildProjectsSystemPrompt', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reflects the current date on every build', () => {
        vi.setSystemTime(new Date(2026, 6, 13, 9, 0, 0));
        expect(buildProjectsSystemPrompt()).toContain('La fecha de hoy es: 2026-07-13');

        vi.setSystemTime(new Date(2026, 6, 14, 0, 5, 0));
        expect(buildProjectsSystemPrompt()).toContain('La fecha de hoy es: 2026-07-14');
    });

    it('stays evidence-first, read-only, and routes task creation to Tasks', () => {
        const prompt = buildProjectsSystemPrompt();

        expect(prompt).toContain('list_projects');
        expect(prompt).toContain('get_project_board');
        expect(prompt).toContain('list_project_time_entries');
        expect(prompt).toContain('get_project_hours_report');
        expect(prompt).toContain('solo lectura');
        expect(prompt).toContain('agente de Tasks');
        expect(prompt).toContain('Nunca combines ARS y USD');
    });
});
