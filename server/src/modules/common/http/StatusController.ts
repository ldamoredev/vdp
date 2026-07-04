import { AgentRegistry } from '../base/agents/AgentRegistry';
import { DomainModuleDescriptor } from '../base/modules/DomainModuleDescriptor';
import { resolveAgentChatAvailability } from '../base/agents/providers/createAgentProvider';
import { AppSettingsRepository } from '../base/settings/AppSettingsRepository';
import { HttpController, RouteRegister } from './HttpController';
import { RouteContextHandler } from './routes';
import { buildStatusResponse } from './responses';

export class StatusController extends HttpController {
    readonly prefix = '/api';

    constructor(
        private agentRegistry: AgentRegistry,
        private modules: DomainModuleDescriptor[],
        private appSettings: AppSettingsRepository,
    ) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes.get('/health', {}, this.health);
    }

    private readonly health: RouteContextHandler<undefined, undefined, undefined> = async ({ request }) => {
        const agentChat = resolveAgentChatAvailability();
        const settings = await this.appSettings.getSettings();
        return buildStatusResponse({
            domains: this.modules.map((module) => module.domain),
            agents: this.agentRegistry.getAll().map((agent) => agent.domain),
            agentChat: agentChat.enabled && !settings.chatEnabledForUsers && request.auth?.role !== 'superadmin'
                ? { enabled: false, reason: 'chat_disabled_by_admin' }
                : agentChat,
        });
    };
}
