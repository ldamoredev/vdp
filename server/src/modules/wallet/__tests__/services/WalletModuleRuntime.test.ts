import { describe, expect, it, vi } from 'vitest';

import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { AgentRepository, AgentConversationRecord, AgentMessageRecord } from '../../../common/base/agents/AgentRepository';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { AgentProviderRequest, AgentProviderResponse } from '../../../common/base/agents/providers/types';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { NoOpEmbeddingProvider } from '../../../common/base/embeddings/NoOpEmbeddingProvider';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ModuleContext } from '../../../common/base/modules/ModuleContext';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { WalletModuleRuntime } from '../../WalletModuleRuntime';
import { AccountRepository } from '../../domain/AccountRepository';
import { CategoryRepository } from '../../domain/CategoryRepository';
import { SpendingSpike } from '../../domain/events/SpendingSpike';
import { ExchangeRateRepository } from '../../domain/ExchangeRateRepository';
import { InvestmentRepository } from '../../domain/InvestmentRepository';
import { SavingsGoalRepository } from '../../domain/SavingsGoalRepository';
import { TransactionRepository } from '../../domain/TransactionRepository';
import { FakeAccountRepository } from '../../infrastructure/fake/FakeAccountRepository';
import { FakeCategoryRepository } from '../../infrastructure/fake/FakeCategoryRepository';
import { FakeExchangeRateRepository } from '../../infrastructure/fake/FakeExchangeRateRepository';
import { FakeInvestmentRepository } from '../../infrastructure/fake/FakeInvestmentRepository';
import { FakeSavingsGoalRepository } from '../../infrastructure/fake/FakeSavingsGoalRepository';
import { FakeTransactionRepository } from '../../infrastructure/fake/FakeTransactionRepository';
import { WalletInsightsStore } from '../../services/WalletInsightsStore';

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

function createContext(insightsStore: WalletInsightsStore): ModuleContext & { insightsStore: WalletInsightsStore } {
    const repositories = new InMemoryRepositoryProvider();

    repositories.register(AccountRepository, new FakeAccountRepository());
    repositories.register(TransactionRepository, new FakeTransactionRepository());
    repositories.register(CategoryRepository, new FakeCategoryRepository());
    repositories.register(SavingsGoalRepository, new FakeSavingsGoalRepository());
    repositories.register(InvestmentRepository, new FakeInvestmentRepository());
    repositories.register(ExchangeRateRepository, new FakeExchangeRateRepository());
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
        embeddingProvider: new NoOpEmbeddingProvider(),
        logger: new NoOpLogger(),
        authContextStorage: new AuthContextStorage(),
        insightsStore,
    };
}

describe('WalletModuleRuntime', () => {
    it('broadcasts live wallet insights only to the matching user and marks only that user as read', async () => {
        const insightsStore = new WalletInsightsStore();
        const deps = createContext(insightsStore);
        const runtime = new WalletModuleRuntime(deps);
        const userAResponse = createResponse();
        const userBResponse = createResponse();

        runtime.registerEventHandlers();

        deps.sseBroadcaster.addClient(userAResponse as never, 'user-a');

        await deps.eventBus.emit(
            new SpendingSpike({
                userId: 'user-a',
                totalExpenses: '12000.00',
                previousAverage: '8000.00',
                percentageIncrease: 50,
                currency: 'ARS',
                periodFrom: '2026-04-07',
                periodTo: '2026-04-11',
            }),
        );
        await deps.eventBus.emit(
            new SpendingSpike({
                userId: 'user-b',
                totalExpenses: '9000.00',
                previousAverage: '5000.00',
                percentageIncrease: 80,
                currency: 'ARS',
                periodFrom: '2026-04-07',
                periodTo: '2026-04-11',
            }),
        );

        expect(userAResponse.write).toHaveBeenCalledWith(
            expect.stringContaining('event: wallet-insight'),
        );
        expect(userAResponse.write).toHaveBeenCalledWith(
            expect.stringContaining('Gasto elevado esta semana'),
        );
        expect(userBResponse.write).not.toHaveBeenCalled();

        expect(insightsStore.getUnreadInsights('user-a')).toEqual([]);
        expect(insightsStore.getUnreadInsights('user-b')).toHaveLength(1);
    });
});
