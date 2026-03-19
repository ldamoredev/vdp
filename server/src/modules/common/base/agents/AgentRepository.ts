export type AgentConversationRecord = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    title: string | null;
    domain: string;
};

export type AgentMessageRecord = {
    id: string;
    createdAt: Date;
    content: string | null;
    conversationId: string;
    role: string;
    toolCalls: unknown;
    toolResult: unknown;
};

export abstract class AgentRepository {
    abstract createConversation(domain: string, title: string): Promise<AgentConversationRecord>;

    abstract createMessage(conversationId: string, role: string, message: string): Promise<void>

    abstract createAgentMessage(conversationId: string, role: string, content: string | null, toolCalls: unknown): Promise<void>

    abstract saveToolResult(conversationId: string, role: string, toolResult: unknown): Promise<void>

    abstract loadHistory(conversationId: string): Promise<AgentMessageRecord[]>

    abstract listConversations(domain: string, limit?: number): Promise<AgentConversationRecord[]>

    abstract loadConversationMessages(domain: string, conversationId: string): Promise<AgentMessageRecord[] | null>
}
