import { idParamsSchema } from '@vdp/shared';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AgentRepository } from '../../../common/base/agents/AgentRepository';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { agentChatBodySchema, createAgentChatHandler } from '../../../common/http/agent-chat';
import { assertFound } from '../../../common/http/errors';
import { RouteContextHandler } from '../../../common/http/routes';
import { AuthContextStorage } from '../../../common/http/AuthContextStorage';

type IdParams = { id: string };

export class HealthAgentController extends HttpController {
    readonly prefix = '/api/v1/health/agent';

    constructor(
        private agentRegistry: AgentRegistry,
        private agentRepository: AgentRepository,
        private authContextStorage: AuthContextStorage,
    ) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/conversations', this.conversations)
            .get('/conversations/:id/messages', { params: idParamsSchema }, this.conversationMessages)
            .post('/chat', createAgentChatHandler({
                schema: agentChatBodySchema,
                resolveAgent: () => this.agentRegistry.get('health'),
                authContextStorage: this.authContextStorage,
            }));
    }

    private readonly conversations = async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = request.auth.userId!;
        const conversations = await this.agentRepository.listConversations(userId, 'health');
        return reply.send(conversations);
    };

    private readonly conversationMessages: RouteContextHandler<IdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const userId = request.auth.userId!;
        const messages = assertFound(
            await this.agentRepository.loadConversationMessages(userId, 'health', params!.id),
            'Conversation not found',
        );
        return reply.send(messages);
    };
}
