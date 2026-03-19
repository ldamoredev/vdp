import { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { Core } from '../../../Core';
import { HttpController } from '../../../common/http/HttpController';
import { agentChatBodySchema, createAgentChatHandler } from '../../../common/http/agent-chat';

export class TasksAgentController implements HttpController {
    constructor(private core: Core) {}

    register(app: FastifyInstance): void {
        const plugin: FastifyPluginCallback = (agentApp, _opts, done) => {
            agentApp.post('/chat', createAgentChatHandler({
                schema: agentChatBodySchema,
                resolveAgent: () => this.core.agentRegistry.get('tasks'),
            }));
            done();
        };

        app.register(plugin, { prefix: '/api/v1/tasks/agent' });
    }
}
