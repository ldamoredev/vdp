import { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { AgentRegistry } from '../../../common/base/agents/AgentRegistry';
import { HttpController } from '../../../common/http/HttpController';
import { agentChatBodySchema, createAgentChatHandler } from '../../../common/http/agent-chat';

export class TasksAgentController implements HttpController {
    constructor(private agentRegistry: AgentRegistry) {}

    register(app: FastifyInstance): void {
        const plugin: FastifyPluginCallback = (agentApp, _opts, done) => {
            agentApp.post('/chat', createAgentChatHandler({
                schema: agentChatBodySchema,
                resolveAgent: () => this.agentRegistry.get('tasks'),
            }));
            done();
        };

        app.register(plugin, { prefix: '/api/v1/tasks/agent' });
    }
}
