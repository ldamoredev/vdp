import { AgentRepository } from './AgentRepository';
import { AgentMessage, AgentToolCall, AgentToolResult } from './providers/types';
import { DomainName } from '../event-bus/DomainEvent';
import { RepositoryProvider } from '../db/RepositoryProvider';
import { AgentError } from './AgentError';

export class AgentConversationStore {
    constructor(private readonly repositories: RepositoryProvider) {}

    async ensureConversation(
        domain: DomainName,
        message: string,
        conversationId?: string,
    ): Promise<string> {
        if (conversationId) {
            const existing = await this.agentRepository().loadConversationMessages(domain, conversationId);
            if (!existing) {
                throw AgentError.conversationNotFound('Conversation not found');
            }
            return conversationId;
        }

        const conversation = await this.agentRepository().createConversation(domain, message.slice(0, 100));
        return conversation.id;
    }

    async saveUserMessage(conversationId: string, message: string): Promise<void> {
        await this.agentRepository().createMessage(conversationId, 'user', message);
    }

    async saveAssistantMessage(
        conversationId: string,
        content: string | null,
        toolCalls: AgentToolCall[],
    ): Promise<void> {
        await this.agentRepository().createAgentMessage(
            conversationId,
            'assistant',
            content,
            toolCalls.length > 0 ? toolCalls : null,
        );
    }

    async saveToolResult(conversationId: string, toolResult: AgentToolResult): Promise<void> {
        await this.agentRepository().saveToolResult(conversationId, 'tool', toolResult);
    }

    async loadMessages(conversationId: string): Promise<AgentMessage[]> {
        const history = await this.agentRepository().loadHistory(conversationId);
        return this.buildMessages(history);
    }

    private buildMessages(history: Awaited<ReturnType<AgentRepository['loadHistory']>>): AgentMessage[] {
        const messages: AgentMessage[] = [];

        for (const msg of history) {
            if (msg.role === 'user') {
                messages.push({ role: 'user', content: msg.content || '' });
                continue;
            }

            if (msg.role === 'assistant') {
                const toolCalls = Array.isArray(msg.toolCalls) ? msg.toolCalls as AgentToolCall[] : [];

                messages.push({
                    role: 'assistant',
                    content: msg.content,
                    ...(toolCalls.length > 0 ? { toolCalls } : {}),
                });
                continue;
            }

            if (msg.role === 'tool' && msg.toolResult) {
                messages.push({
                    role: 'tool',
                    toolResult: msg.toolResult as AgentToolResult,
                });
            }
        }

        return messages;
    }

    private agentRepository(): AgentRepository {
        return this.repositories.get(AgentRepository);
    }
}
