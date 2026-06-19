import { CQBus, ExecutionContext } from '@nbottarini/cqbus';
import { describe, expect, it } from 'vitest';

import { AgentRepository, AgentConversationRecord, AgentMessageRecord } from '../../../common/base/agents/AgentRepository';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { AgentProviderRequest, AgentProviderResponse } from '../../../common/base/agents/providers/types';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { ModuleContext } from '../../../common/base/modules/ModuleContext';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';
import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { TaskModule } from '../../TaskModule';
import { GetTasksQuery } from '../../app/GetTasksQuery';
import { TaskEmbeddingRepository } from '../../domain/TaskEmbeddingRepository';
import { TaskNoteRepository } from '../../domain/TaskNoteRepository';
import { TaskRepository } from '../../domain/TaskRepository';
import { TaskInsightRepository } from '../../domain/TaskInsightRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { FakeTaskInsightRepository } from '../fakes/FakeTaskInsightRepository';

class FakeAgentProvider implements AgentProvider {
    readonly name = 'fake';
    readonly defaultModel = 'fake-model';

    async generate(_request: AgentProviderRequest): Promise<AgentProviderResponse> {
        return {
            text: '',
            toolCalls: [],
            stopReason: 'stop',
        };
    }
}

class FakeAgentRepository extends AgentRepository {
    async createConversation(_userId: string, domain: string, title: string): Promise<AgentConversationRecord> {
        return {
            id: 'conversation-1',
            userId: 'test-user',
            createdAt: new Date(),
            updatedAt: new Date(),
            title,
            domain,
        };
    }

    async createMessage(_conversationId: string, _role: string, _message: string): Promise<void> {}

    async createAgentMessage(
        _conversationId: string,
        _role: string,
        _content: string | null,
        _toolCalls: unknown,
    ): Promise<void> {}

    async saveToolResult(_conversationId: string, _role: string, _toolResult: unknown): Promise<void> {}

    async loadHistory(_conversationId: string): Promise<AgentMessageRecord[]> {
        return [];
    }

    async listConversations(_userId: string, _domain: string, _limit?: number): Promise<AgentConversationRecord[]> {
        return [];
    }

    async loadConversationMessages(
        _userId: string,
        _domain: string,
        _conversationId: string,
    ): Promise<AgentMessageRecord[] | null> {
        return [];
    }
}

class InMemoryRepositoryProvider extends RepositoryProvider {
    private readonly registry = new Map<abstract new (...args: any[]) => any, any>();

    register<T>(token: abstract new (...args: any[]) => T, instance: T): void {
        this.registry.set(token, instance);
    }

    protected create<T>(token: abstract new (...args: any[]) => T): T {
        const instance = this.registry.get(token);
        if (!instance) {
            throw new Error(`Repository ${token.name} not registered`);
        }

        return instance;
    }
}

function createContext(): ModuleContext {
    const repositories = new InMemoryRepositoryProvider();

    repositories.register(TaskRepository, new FakeTaskRepository());
    repositories.register(TaskNoteRepository, new FakeTaskNoteRepository());
    repositories.register(TaskEmbeddingRepository, new FakeTaskEmbeddingRepository());
    repositories.register(AgentRepository, new FakeAgentRepository());
    repositories.register(TaskInsightRepository, new FakeTaskInsightRepository());
    const unusedServices = new Proxy({}, {
        get() {
            throw new Error('TaskModule must not access the legacy service registry');
        },
    }) as ModuleContext['services'];

    return {
        repositories,
        bus: new CQBus(),
        services: unusedServices,
        eventBus: new EventBus(),
        agentRegistry: new AgentRegistry(),
        sseBroadcaster: new SSEBroadcaster(),
        llmTraceService: new NoOpLangfuseLLMTraceService(),
        traceService: new NoOpOpenTelemetryService(),
        agentProvider: new FakeAgentProvider(),
        embeddingProvider: new FakeEmbeddingProvider(),
        logger: new NoOpLogger(),
        authContextStorage: new AuthContextStorage(),
    };
}

describe('TaskModule', () => {
    it('registers handlers, controllers, and agent through the runtime composer', async () => {
        const context = createContext();
        const module = new TaskModule(context).bootstrap();

        await expect(
            context.bus.execute(
                new GetTasksQuery(),
                ExecutionContext.empty().withIdentity(new UserIdentity('user-1')),
            ),
        ).resolves.toMatchObject({ tasks: [], total: 0 });
        expect(context.agentRegistry.has('tasks')).toBe(true);
        expect(module.getControllers()).toHaveLength(3);
        expect(module.getDescriptor()).toEqual({ domain: 'tasks', label: 'Tasks' });
    });
});
