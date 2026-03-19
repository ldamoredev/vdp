import { Database } from '../../base/db/Database';
import { AgentConversationRecord, AgentMessageRecord, AgentRepository } from '../../base/agents/AgentRepository';
import { agentConversations, agentMessages } from './schema';
import { and, asc, desc, eq } from 'drizzle-orm';

export class DrizzleAgentRepository extends AgentRepository {
    constructor(private db: Database) {
        super();
    }

    async createConversation(domain: string, title: string): Promise<AgentConversationRecord> {
        const [conv] = await this.db.query
            .insert(agentConversations)
            .values({
                domain,
                title,
            })
            .returning();
        return conv;
    }

    async createMessage(conversationId: string, role: string, message: string): Promise<void> {
        await this.db.query.insert(agentMessages).values({ conversationId, role , content: message});
        await this.touchConversation(conversationId);
    }

    async createAgentMessage(conversationId: string, role: string, content: string | null, toolCalls: unknown): Promise<void> {
        await this.db.query.insert(agentMessages).values({
            conversationId,
            role,
            content,
            toolCalls,
        });
        await this.touchConversation(conversationId);
    }

    async saveToolResult(conversationId: string, role: string, toolResult: unknown): Promise<void> {
        await this.db.query.insert(agentMessages).values({
            conversationId,
            role,
            toolResult,
        });
        await this.touchConversation(conversationId);
    }

    async loadHistory(conversationId: string): Promise<AgentMessageRecord[]> {
        return await this.db.query
            .select()
            .from(agentMessages)
            .where(eq(agentMessages.conversationId, conversationId))
            .orderBy(asc(agentMessages.createdAt));
    }

    async listConversations(domain: string, limit = 50): Promise<AgentConversationRecord[]> {
        return await this.db.query
            .select()
            .from(agentConversations)
            .where(eq(agentConversations.domain, domain))
            .orderBy(desc(agentConversations.updatedAt))
            .limit(limit);
    }

    async loadConversationMessages(domain: string, conversationId: string): Promise<AgentMessageRecord[] | null> {
        const [conversation] = await this.db.query
            .select()
            .from(agentConversations)
            .where(and(
                eq(agentConversations.id, conversationId),
                eq(agentConversations.domain, domain),
            ))
            .limit(1);

        if (!conversation) return null;

        return this.loadHistory(conversationId);
    }

    private async touchConversation(conversationId: string): Promise<void> {
        await this.db.query
            .update(agentConversations)
            .set({ updatedAt: new Date() })
            .where(eq(agentConversations.id, conversationId));
    }
}
