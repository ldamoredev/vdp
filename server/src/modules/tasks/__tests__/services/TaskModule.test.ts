import { describe, expect, it } from 'vitest';

import { AgentRepository, AgentConversationRecord, AgentMessageRecord } from '../../../common/base/agents/AgentRepository';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { AgentProviderRequest, AgentProviderResponse } from '../../../common/base/agents/providers/types';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { ModuleContext } from '../../../common/base/modules/ModuleContext';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { TaskModule } from '../../TaskModule';
import { TaskEmbeddingRepository } from '../../domain/TaskEmbeddingRepository';
import { TaskNoteRepository } from '../../domain/TaskNoteRepository';
import { TaskRepository } from '../../domain/TaskRepository';
import { FakeEmbeddingProvider } from '../fakes/FakeEmbeddingProvider';
import { FakeTaskEmbeddingRepository } from '../fakes/FakeTaskEmbeddingRepository';
import { FakeTaskNoteRepository } from '../fakes/FakeTaskNoteRepository';
import { FakeTaskRepository } from '../fakes/FakeTaskRepository';
import { AddTaskNote } from '../../services/AddTaskNote';
import { CreateTask } from '../../services/CreateTask';
import { FindSimilarTasks } from '../../services/FindSimilarTasks';
import { GetTasks } from '../../services/GetTasks';

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
    async createConversation(domain: string, title: string): Promise<AgentConversationRecord> {
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

    async listConversations(_domain: string, _limit?: number): Promise<AgentConversationRecord[]> {
        return [];
    }

    async loadConversationMessages(
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

    return {
        repositories,
        services: new ServiceProvider(),
        eventBus: new EventBus(),
        agentRegistry: new AgentRegistry(),
        sseBroadcaster: new SSEBroadcaster(),
        llmTraceService: new NoOpLangfuseLLMTraceService(),
        traceService: new NoOpOpenTelemetryService(),
        agentProvider: new FakeAgentProvider(),
        embeddingProvider: new FakeEmbeddingProvider(),
        logger: new NoOpLogger(),
    };
}

describe('TaskModule', () => {
    it('registers its service graph, controllers, and agent through the runtime composer', () => {
        const context = createContext();
        const module = new TaskModule(context).bootstrap();

        expect(context.services.get(GetTasks)).toBeInstanceOf(GetTasks);
        expect(context.services.get(CreateTask)).toBeInstanceOf(CreateTask);
        expect(context.services.get(AddTaskNote)).toBeInstanceOf(AddTaskNote);
        expect(context.services.get(FindSimilarTasks)).toBeInstanceOf(FindSimilarTasks);
        expect(context.agentRegistry.has('tasks')).toBe(true);
        expect(module.getControllers()).toHaveLength(3);
        expect(module.getDescriptor()).toEqual({ domain: 'tasks', label: 'Tasks' });
    });
});
