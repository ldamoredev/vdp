import { describe, expect, it } from 'vitest';

import { AppRunner } from '../../../../AppRunner';
import { RuntimeLifecycle, TerminationSignal } from '../../../../runtime/RuntimeLifecycle';

class FakeApp {
    public startCalls: Array<{ port: number; host: string }> = [];
    public stopCalls: unknown[] = [];
    public startError: unknown = null;

    async start(port: number, host: string): Promise<void> {
        this.startCalls.push({ port, host });

        if (this.startError) {
            throw this.startError;
        }
    }

    async stop(error?: unknown): Promise<void> {
        this.stopCalls.push(error);
    }
}

class FakeRuntimeLifecycle implements RuntimeLifecycle {
    public handlers = new Map<TerminationSignal, () => void>();
    public exitCodes: number[] = [];

    once(signal: TerminationSignal, handler: () => void): void {
        this.handlers.set(signal, handler);
    }

    exit(code: number): void {
        this.exitCodes.push(code);
    }
}

describe('AppRunner', () => {
    it('starts the app and registers termination handlers once', async () => {
        const app = new FakeApp();
        const runtime = new FakeRuntimeLifecycle();
        const runner = new AppRunner(app as never, runtime);

        runner.registerSignalHandlers();
        runner.registerSignalHandlers();
        await runner.run(4001, '0.0.0.0');

        expect(runtime.handlers.size).toBe(2);
        expect(app.startCalls).toEqual([{ port: 4001, host: '0.0.0.0' }]);
        expect(runtime.exitCodes).toEqual([]);
    });

    it('stops the app and exits with status 1 when startup fails', async () => {
        const app = new FakeApp();
        app.startError = new Error('boot failed');
        const runtime = new FakeRuntimeLifecycle();
        const runner = new AppRunner(app as never, runtime);

        await runner.run(4001, '0.0.0.0');

        expect(app.stopCalls).toHaveLength(1);
        expect(app.stopCalls[0]).toBeInstanceOf(Error);
        expect(runtime.exitCodes).toEqual([1]);
    });

    it('stops the app and exits with status 0 on signal', async () => {
        const app = new FakeApp();
        const runtime = new FakeRuntimeLifecycle();
        const runner = new AppRunner(app as never, runtime);

        runner.registerSignalHandlers();
        runtime.handlers.get('SIGTERM')?.();
        await Promise.resolve();

        expect(app.stopCalls).toEqual([undefined]);
        expect(runtime.exitCodes).toEqual([0]);
    });
});
