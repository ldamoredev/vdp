import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildWalletSystemPrompt } from '../../infrastructure/agent/system-prompt';

// Guards against the prompt date being captured at module load: a server
// process that lives across midnight must keep telling the agent the right
// "today".
describe('buildWalletSystemPrompt', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reflects the current date on every build', () => {
        vi.setSystemTime(new Date(2026, 5, 11, 9, 0, 0));
        expect(buildWalletSystemPrompt()).toContain('La fecha de hoy es: 2026-06-11');

        vi.setSystemTime(new Date(2026, 5, 12, 0, 5, 0));
        expect(buildWalletSystemPrompt()).toContain('La fecha de hoy es: 2026-06-12');
    });
});
