import { Task } from '../../../tasks/domain/Task';

export abstract class AgentRepository {
    // ─── CRUD ────────────────────────────────────────────
    abstract createConversation(domain: string, title: string): Promise<{
        id: string
        createdAt: Date
        updatedAt: Date
        title: string | null
        domain: string
    }>;

    abstract createMessage(conversationId: string, role: string, message: string): Promise<void>

    abstract createAgentMessage(conversationId: string, role: string, content: string | null, toolCalls: unknown): Promise<void>

    abstract saveToolResult(conversationId: string, role: string, toolResult: unknown): Promise<void>

    abstract loadHistory(conversationId: string): Promise<{
        id: string
        createdAt: Date
        content: string | null
        conversationId: string
        role: string
        toolCalls: unknown
        toolResult: unknown
    }[]>
}
