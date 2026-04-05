import { describe, expect, it } from 'vitest';

import { App } from '../../../../App';
import { AgentRegistry } from '../../base/agents/AgentRegistry';
import { AuditLogRepository } from '../../../auth/domain/AuditLogRepository';
import { CreateSessionData, SessionRecord, SessionRepository } from '../../../auth/domain/SessionRepository';
import { CreateUserData, UserRecord, UserRepository } from '../../../auth/domain/UserRepository';
import { EventBus } from '../../base/event-bus/EventBus';
import { DomainModuleDescriptor } from '../../base/modules/DomainModuleDescriptor';
import { HttpController } from '../../http/HttpController';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { HttpMiddleWare } from '../../http/HttpMiddleWare';

class FakeCore {
    public readonly eventBus = new EventBus();
    public readonly agentRegistry = new AgentRegistry();
    private readonly authContextStorage = new AuthContextStorage();
    public startCalls = 0;
    public shutdownCalls = 0;
    private readonly repositories = new Map<abstract new (...args: any[]) => unknown, unknown>([
        [UserRepository, new FakeUserRepository()],
        [SessionRepository, new FakeSessionRepository()],
        [AuditLogRepository, new FakeAuditLogRepository()],
    ]);

    getControllers(): HttpController[] {
        return [];
    }

    getRepository<T>(token: abstract new (...args: any[]) => T): T {
        const repository = this.repositories.get(token);
        if (!repository) {
            throw new Error(`Repository ${token.name} not registered`);
        }

        return repository as T;
    }

    getAuthContextStorage(): AuthContextStorage {
        return this.authContextStorage;
    }

    getMiddlewares(): HttpMiddleWare[] {
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

class FakeUserRepository extends UserRepository {
    async countUsers(): Promise<number> {
        return 0;
    }

    async findByEmail(): Promise<null> {
        return null;
    }

    async findById(): Promise<null> {
        return null;
    }

    async createUser(_data: CreateUserData): Promise<UserRecord> {
        throw new Error('Not implemented');
    }

    async updateLastLoginAt(): Promise<void> {}
}

class FakeSessionRepository extends SessionRepository {
    async createSession(_data: CreateSessionData): Promise<SessionRecord> {
        throw new Error('Not implemented');
    }

    async findByTokenHash(): Promise<null> {
        return null;
    }

    async touchSession(): Promise<void> {}

    async revokeSession(): Promise<void> {}
}

class FakeAuditLogRepository extends AuditLogRepository {
    async createLog(): Promise<void> {}
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
