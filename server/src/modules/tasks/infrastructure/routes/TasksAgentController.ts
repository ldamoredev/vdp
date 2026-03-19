import { idParamsSchema } from '@vdp/shared';
import { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';
import { AgentRepository } from '../../../common/base/agents/AgentRepository';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { HttpController } from '../../../common/http/HttpController';
import { agentChatBodySchema, createAgentChatHandler } from '../../../common/http/agent-chat';
import { assertFound } from '../../../common/http/errors';
import { parseParams } from '../../../common/http/validation';

type IdParams = { Params: { id: string } };

export class TasksAgentController implements HttpController {
    constructor(
        private agentRegistry: AgentRegistry,
        private agentRepository: AgentRepository,
    ) {}

    register(app: FastifyInstance): void {
        const plugin: FastifyPluginCallback = (agentApp, _opts, done) => {
            agentApp.get('/conversations', this.listConversations.bind(this));
            agentApp.get<IdParams>('/conversations/:id/messages', this.listMessages.bind(this));
            agentApp.post('/chat', createAgentChatHandler({
                schema: agentChatBodySchema,
                resolveAgent: () => this.agentRegistry.get('tasks'),
            }));
            done();
        };

        app.register(plugin, { prefix: '/api/v1/tasks/agent' });
    }

    private async listConversations(_request: FastifyRequest, reply: FastifyReply) {
        const conversations = await this.agentRepository.listConversations('tasks');
        return reply.send(conversations);
    }

    private async listMessages(request: FastifyRequest<IdParams>, reply: FastifyReply) {
        const params = parseParams(idParamsSchema, request.params);
        const messages = assertFound(
            await this.agentRepository.loadConversationMessages('tasks', params.id),
            'Conversation not found',
        );
        return reply.send(messages);
    }
}
