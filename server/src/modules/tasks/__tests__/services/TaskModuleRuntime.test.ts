import { describe, expect, it, vi } from 'vitest';

import { AgentRepository, AgentConversationRecord, AgentMessageRecord } from '../../../common/base/agents/AgentRepository';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { AgentProviderRequest, AgentProviderResponse } from '../../../common/base/agents/providers/types';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ModuleContext } from '../../../common/base/modules/ModuleContext';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { TaskModuleRuntime } from '../../TaskModuleRuntime';
import { TaskEmbeddingRepository } from '../../domain/TaskEmbeddingRepository';
import { TaskNoteRepository } from '../../domain/TaskNoteRepository';
import { TaskRepository } from '../../domain/TaskRepository';
import { TaskCompleted } from '../../domain/events/TaskCompleted';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';

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

type FakeResponse = {
    writeHead: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
};

function createResponse(): FakeResponse {
    return {
        writeHead: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
    };
}

function createContext(insightsStore: TaskInsightsStore): ModuleContext & { insightsStore: TaskInsightsStore } {
    const repositories = new InMemoryRepositoryProvider();

    repositories.register(TaskRepository, new FakeTaskRepository());
    repositories.register(TaskNoteRepository, new FakeTaskNoteRepository());
    repositories.register(TaskEmbeddingRepository, new FakeTaskEmbeddingRepository());
    repositories.register(AgentRepository, new FakeAgentRepository());

    return {
        repositories,
        services: new ServiceProvider(),
        eventBus: new EventBus(),
        agentRegistry: new AgentRegistry(),
        sseBroadcaster: new SSEBroadcaster(undefined, 60_000),
        llmTraceService: new NoOpLangfuseLLMTraceService(),
        traceService: new NoOpOpenTelemetryService(),
        agentProvider: new FakeAgentProvider(),
        embeddingProvider: new FakeEmbeddingProvider(),
        logger: new NoOpLogger(),
        authContextStorage: new AuthContextStorage(),
        insightsStore,
    };
}

describe('TaskModuleRuntime', () => {
    it('broadcasts live insights only to the matching user and marks only that users insights as read', async () => {
        const insightsStore = new TaskInsightsStore();
        const deps = createContext(insightsStore);
        const runtime = new TaskModuleRuntime(deps);
        const userAResponse = createResponse();
        const userBResponse = createResponse();

        runtime.registerServices();
        runtime.registerEventHandlers();

        deps.sseBroadcaster.addClient(userAResponse as never, 'user-a');

        await deps.eventBus.emit(new TaskCompleted({
            userId: 'user-a',
            taskId: 'task-a',
            scheduledDate: '2026-04-06',
        }));
        await deps.eventBus.emit(new TaskCompleted({
            userId: 'user-b',
            taskId: 'task-b',
            scheduledDate: '2026-04-06',
        }));

        expect(userAResponse.write).toHaveBeenCalledWith(
            expect.stringContaining('event: insight'),
        );
        expect(userAResponse.write).toHaveBeenCalledWith(
            expect.stringContaining('Tarea completada'),
        );
        expect(userBResponse.write).not.toHaveBeenCalled();

        expect(insightsStore.getUnreadInsights('user-a')).toEqual([]);
        expect(insightsStore.getUnreadInsights('user-b')).toHaveLength(1);
    });
});
