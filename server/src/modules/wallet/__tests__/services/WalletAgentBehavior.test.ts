import { describe, expect, it } from 'vitest';

import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { AgentRepository, AgentConversationRecord, AgentMessageRecord } from '../../../common/base/agents/AgentRepository';
import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import { AgentMessage, AgentProviderRequest, AgentProviderResponse, AgentToolResult } from '../../../common/base/agents/providers/types';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { RepositoryProvider } from '../../../common/base/db/RepositoryProvider';
import { NoOpEmbeddingProvider } from '../../../common/base/embeddings/NoOpEmbeddingProvider';
import { EventBus } from '../../../common/base/event-bus/EventBus';
import { ModuleContext } from '../../../common/base/modules/ModuleContext';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { SSEBroadcaster } from '../../../common/base/sse/SSEBroadcaster';
import { NoOpLogger } from '../../../common/infrastructure/observability/logging/NoOpLogger';
import { NoOpLangfuseLLMTraceService } from '../../../common/infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { NoOpOpenTelemetryService } from '../../../common/infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';
import { WalletModule } from '../../WalletModule';
import { AccountRepository } from '../../domain/AccountRepository';
import { CategoryRepository } from '../../domain/CategoryRepository';
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

class ScriptedAgentProvider implements AgentProvider {
    readonly name = 'fake';
    readonly defaultModel = 'fake-model';
    readonly requests: AgentProviderRequest[] = [];

    constructor(
        private readonly responder: (
            request: AgentProviderRequest,
            callIndex: number,
        ) => Promise<AgentProviderResponse> | AgentProviderResponse,
    ) {}

    async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
        const callIndex = this.requests.length;
        this.requests.push(request);
        return this.responder(request, callIndex);
    }
}

class InMemoryAgentRepository extends AgentRepository {
    private conversationSeq = 0;
    private messageSeq = 0;
    private readonly conversations = new Map<string, AgentConversationRecord>();
    private readonly messages = new Map<string, AgentMessageRecord[]>();

    async createConversation(_userId: string, domain: string, title: string): Promise<AgentConversationRecord> {
        this.conversationSeq += 1;
        const now = new Date();
        const conversation: AgentConversationRecord = {
            id: `conversation-${this.conversationSeq}`,
            userId: 'test-user',
            createdAt: now,
            updatedAt: now,
            title,
            domain,
        };
        this.conversations.set(conversation.id, conversation);
        this.messages.set(conversation.id, []);
        return conversation;
    }

    async createMessage(conversationId: string, role: string, message: string): Promise<void> {
        this.pushMessage(conversationId, role, message, null, null);
    }

    async createAgentMessage(
        conversationId: string,
        role: string,
        content: string | null,
        toolCalls: unknown,
    ): Promise<void> {
        this.pushMessage(conversationId, role, content, toolCalls, null);
    }

    async saveToolResult(conversationId: string, role: string, toolResult: unknown): Promise<void> {
        this.pushMessage(conversationId, role, null, null, toolResult);
    }

    async loadHistory(conversationId: string): Promise<AgentMessageRecord[]> {
        return [...(this.messages.get(conversationId) ?? [])];
    }

    async listConversations(_userId: string, domain: string, limit?: number): Promise<AgentConversationRecord[]> {
        const matches = Array.from(this.conversations.values()).filter((conversation) => conversation.domain === domain);
        return typeof limit === 'number' ? matches.slice(0, limit) : matches;
    }

    async loadConversationMessages(
        _userId: string,
        domain: string,
        conversationId: string,
    ): Promise<AgentMessageRecord[] | null> {
        const conversation = this.conversations.get(conversationId);
        if (!conversation || conversation.domain !== domain) {
            return null;
        }
        return this.loadHistory(conversationId);
    }

    private pushMessage(
        conversationId: string,
        role: string,
        content: string | null,
        toolCalls: unknown,
        toolResult: unknown,
    ): void {
        this.messageSeq += 1;
        const history = this.messages.get(conversationId);
        if (!history) {
            throw new Error(`Conversation ${conversationId} not found`);
        }

        history.push({
            id: `message-${this.messageSeq}`,
            createdAt: new Date(),
            content,
            conversationId,
            role,
            toolCalls,
            toolResult,
        });
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

function createContext(provider: AgentProvider) {
    const repositories = new InMemoryRepositoryProvider();
    const accountRepo = new FakeAccountRepository();
    const transactionRepo = new FakeTransactionRepository();
    const categoryRepo = new FakeCategoryRepository();
    const savingsGoalRepo = new FakeSavingsGoalRepository();
    const investmentRepo = new FakeInvestmentRepository();
    const exchangeRateRepo = new FakeExchangeRateRepository();
    const agentRepository = new InMemoryAgentRepository();

    repositories.register(AccountRepository, accountRepo);
    repositories.register(TransactionRepository, transactionRepo);
    repositories.register(CategoryRepository, categoryRepo);
    repositories.register(SavingsGoalRepository, savingsGoalRepo);
    repositories.register(InvestmentRepository, investmentRepo);
    repositories.register(ExchangeRateRepository, exchangeRateRepo);
    repositories.register(AgentRepository, agentRepository);

    const context: ModuleContext = {
        repositories,
        services: new ServiceProvider(),
        eventBus: new EventBus(),
        agentRegistry: new AgentRegistry(),
        sseBroadcaster: new SSEBroadcaster(),
        llmTraceService: new NoOpLangfuseLLMTraceService(),
        traceService: new NoOpOpenTelemetryService(),
        agentProvider: provider,
        embeddingProvider: new NoOpEmbeddingProvider(),
        logger: new NoOpLogger(),
        authContextStorage: new AuthContextStorage(),
    };

    new WalletModule(context).bootstrap();

    return {
        context,
        savingsGoalRepo,
        investmentRepo,
        exchangeRateRepo,
    };
}

async function runWalletChat(context: ModuleContext, message: string) {
    context.authContextStorage.setAuthContext({
        isAuthenticated: true,
        userId: 'test-user-id',
        sessionId: 'test-session',
        role: 'user',
        email: 'test@test.com',
        displayName: 'Test User',
    });

    const agent = context.agentRegistry.get('wallet');
    if (!agent) {
        throw new Error('Wallet agent not registered');
    }

    const texts: string[] = [];
    const toolUses: Array<{ tool: string; input: unknown }> = [];
    const toolResults: Array<{ tool: string; result: string }> = [];
    const done: Array<{ conversationId: string; traceId?: string }> = [];
    const errors: string[] = [];

    await agent.chat({
        userId: 'test-user-id',
        message,
        callbacks: {
            onText: (text) => texts.push(text),
            onToolUse: (tool, input) => toolUses.push({ tool, input }),
            onToolResult: (tool, result) => toolResults.push({ tool, result }),
            onDone: (conversationId, traceId) => done.push({ conversationId, traceId }),
            onError: (error) => errors.push(error),
        },
    });

    return { texts, toolUses, toolResults, done, errors };
}

function getLastToolResult(messages: AgentMessage[]): AgentToolResult {
    const toolMessage = [...messages].reverse().find((message) => message.role === 'tool');
    if (!toolMessage || toolMessage.role !== 'tool') {
        throw new Error('Expected tool result in message history');
    }
    return toolMessage.toolResult;
}

describe('WalletAgent conversational behavior', () => {
    it('uses savings tools to answer a savings progress question', async () => {
        const provider = new ScriptedAgentProvider((request, callIndex) => {
            expect(request.tools.some((tool) => tool.name === 'list_savings_goals')).toBe(true);

            if (callIndex === 0) {
                expect(request.messages).toEqual([
                    { role: 'user', content: 'Como viene mi fondo de emergencia?' },
                ]);
                return {
                    text: '',
                    toolCalls: [{ id: 'tool-1', name: 'list_savings_goals', input: {} }],
                    stopReason: 'tool_use',
                };
            }

            const result = JSON.parse(getLastToolResult(request.messages).content);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Fondo de emergencia');

            return {
                text: 'Tu fondo de emergencia va 350 de 1000 USD.',
                toolCalls: [],
                stopReason: 'stop',
            };
        });

        const { context, savingsGoalRepo } = createContext(provider);
        savingsGoalRepo.seed([
            {
                id: 'goal-1',
                name: 'Fondo de emergencia',
                targetAmount: '1000.00',
                currentAmount: '350.00',
                currency: 'USD',
                deadline: '2026-12-31',
                isCompleted: false,
                createdAt: new Date('2026-03-01T00:00:00.000Z'),
                updatedAt: new Date('2026-03-20T00:00:00.000Z'),
            },
        ]);

        const result = await runWalletChat(context, 'Como viene mi fondo de emergencia?');

        expect(result.errors).toEqual([]);
        expect(result.texts).toEqual(['Tu fondo de emergencia va 350 de 1000 USD.']);
        expect(result.toolUses).toEqual([{ tool: 'list_savings_goals', input: {} }]);
        expect(JSON.parse(result.toolResults[0].result)[0]).toMatchObject({
            id: 'goal-1',
            name: 'Fondo de emergencia',
            currentAmount: '350.00',
        });
        expect(result.done).toHaveLength(1);
    });

    it('can inspect investments and then update one in a multi-step flow', async () => {
        const provider = new ScriptedAgentProvider((request, callIndex) => {
            expect(request.tools.some((tool) => tool.name === 'update_investment')).toBe(true);

            if (callIndex === 0) {
                return {
                    text: '',
                    toolCalls: [{ id: 'tool-1', name: 'list_investments', input: {} }],
                    stopReason: 'tool_use',
                };
            }

            if (callIndex === 1) {
                const investments = JSON.parse(getLastToolResult(request.messages).content);
                expect(investments[0].name).toBe('NASDAQ ETF');

                return {
                    text: '',
                    toolCalls: [
                        {
                            id: 'tool-2',
                            name: 'update_investment',
                            input: {
                                investmentId: investments[0].id,
                                currentValue: '1080.25',
                                notes: 'Valuacion actualizada por chat',
                            },
                        },
                    ],
                    stopReason: 'tool_use',
                };
            }

            const updatedInvestment = JSON.parse(getLastToolResult(request.messages).content);
            expect(updatedInvestment.currentValue).toBe('1080.25');

            return {
                text: 'Listo, actualice NASDAQ ETF a 1080.25 USD.',
                toolCalls: [],
                stopReason: 'stop',
            };
        });

        const { context, investmentRepo } = createContext(provider);
        investmentRepo.seed([
            {
                id: 'investment-1',
                name: 'NASDAQ ETF',
                type: 'cedear',
                accountId: null,
                currency: 'USD',
                investedAmount: '1000.00',
                currentValue: '1035.50',
                startDate: '2026-02-01',
                endDate: null,
                rate: '0.0355',
                notes: 'Growth allocation',
                isActive: true,
                createdAt: new Date('2026-02-01T00:00:00.000Z'),
                updatedAt: new Date('2026-03-20T00:00:00.000Z'),
            },
        ]);

        const result = await runWalletChat(
            context,
            'Actualiza el valor de mi NASDAQ ETF a 1080.25 USD',
        );

        const [updatedInvestment] = await investmentRepo.findAll('test-user-id');

        expect(result.errors).toEqual([]);
        expect(result.toolUses.map((entry) => entry.tool)).toEqual([
            'list_investments',
            'update_investment',
        ]);
        expect(updatedInvestment).toMatchObject({
            id: 'investment-1',
            currentValue: '1080.25',
            notes: 'Valuacion actualizada por chat',
        });
        expect(result.texts).toEqual(['Listo, actualice NASDAQ ETF a 1080.25 USD.']);
    });

    it('uses exchange rate tools to answer an FX question with the filtered latest rate', async () => {
        const provider = new ScriptedAgentProvider((request, callIndex) => {
            expect(request.tools.some((tool) => tool.name === 'get_exchange_rates')).toBe(true);

            if (callIndex === 0) {
                return {
                    text: '',
                    toolCalls: [
                        {
                            id: 'tool-1',
                            name: 'get_exchange_rates',
                            input: { fromCurrency: 'USD', toCurrency: 'ARS', type: 'blue' },
                        },
                    ],
                    stopReason: 'tool_use',
                };
            }

            const rates = JSON.parse(getLastToolResult(request.messages).content);
            expect(rates).toHaveLength(1);
            expect(rates[0].type).toBe('blue');

            return {
                text: 'El ultimo dolar blue registrado es 1102.2500 ARS.',
                toolCalls: [],
                stopReason: 'stop',
            };
        });

        const { context, exchangeRateRepo } = createContext(provider);
        exchangeRateRepo.seed([
            {
                id: 'rate-1',
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                rate: '1102.2500',
                type: 'blue',
                date: '2026-03-21',
                createdAt: new Date('2026-03-21T00:00:00.000Z'),
            },
            {
                id: 'rate-2',
                fromCurrency: 'USD',
                toCurrency: 'ARS',
                rate: '1085.5000',
                type: 'official',
                date: '2026-03-21',
                createdAt: new Date('2026-03-21T00:00:00.000Z'),
            },
        ]);

        const result = await runWalletChat(context, 'A cuanto tengo registrado el dolar blue?');

        expect(result.errors).toEqual([]);
        expect(result.toolUses).toEqual([
            {
                tool: 'get_exchange_rates',
                input: { fromCurrency: 'USD', toCurrency: 'ARS', type: 'blue' },
            },
        ]);
        expect(JSON.parse(result.toolResults[0].result)).toEqual([
            expect.objectContaining({
                id: 'rate-1',
                type: 'blue',
                rate: '1102.2500',
            }),
        ]);
        expect(result.texts).toEqual(['El ultimo dolar blue registrado es 1102.2500 ARS.']);
    });
});
