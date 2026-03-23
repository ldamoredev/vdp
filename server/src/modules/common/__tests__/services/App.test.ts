import { describe, expect, it } from 'vitest';

import { App } from '../../../../App';
import { AgentRegistry } from '../../base/agents/AgentRegistry';
import { EventBus } from '../../base/event-bus/EventBus';
import { DomainModuleDescriptor } from '../../base/modules/DomainModuleDescriptor';
import { HttpController } from '../../http/HttpController';

class FakeCore {
    public readonly eventBus = new EventBus();
    public readonly agentRegistry = new AgentRegistry();
    public startCalls = 0;
    public shutdownCalls = 0;

    getControllers(): HttpController[] {
        return [];
    }

    getModuleDescriptors(): DomainModuleDescriptor[] {
        return [{ domain: 'tasks', label: 'Tasks' }];
    }

    async start(): Promise<void> {
        this.startCalls += 1;
    }

    async shutdown(): Promise<void> {
        this.shutdownCalls += 1;
    }
}

describe('App', () => {
    it('stops once even when stop is called repeatedly', async () => {
        const core = new FakeCore();
        const app = new App(core as never);
        let closeCalls = 0;

        (app.app.close as unknown as () => Promise<void>) = async () => {
            closeCalls += 1;
        };

        try {
            await app.stop();
            await app.stop();

            expect(core.startCalls).toBe(0);
            expect(core.shutdownCalls).toBe(1);
            expect(closeCalls).toBe(1);
        } finally {
            await app.stop();
        }
    });
});
