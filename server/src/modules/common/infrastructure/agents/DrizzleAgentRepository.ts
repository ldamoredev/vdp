import { Database } from '../../base/db/Database';
import { AgentRepository } from '../../base/agents/AgentRepository';
import { agentConversations, agentMessages } from './schema';
import { asc, eq } from 'drizzle-orm';

export class DrizzleAgentRepository extends AgentRepository {
    constructor(private db: Database) {
        super();
    }

    async createConversation(domain: string, title: string): Promise<{ id: string; createdAt: Date; updatedAt: Date; title: string | null; domain: string; }> {
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
    }

    async createAgentMessage(conversationId: string, role: string, content: string | null, toolCalls: unknown): Promise<void> {
        await this.db.query.insert(agentMessages).values({
            conversationId,
            role,
            content,
            toolCalls,
        });
    }

    async saveToolResult(conversationId: string, role: string, toolResult: unknown): Promise<void> {
        await this.db.query.insert(agentMessages).values({
            conversationId,
            role,
            toolResult,
        });

    }

    async loadHistory(conversationId: string): Promise<{ id: string; createdAt: Date; content: string | null; conversationId: string; role: string; toolCalls: unknown; toolResult: unknown; }[]> {
        return await this.db.query
            .select()
            .from(agentMessages)
            .where(eq(agentMessages.conversationId, conversationId))
            .orderBy(asc(agentMessages.createdAt));
    }
}
