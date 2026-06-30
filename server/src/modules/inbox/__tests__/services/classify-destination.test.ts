import { describe, expect, it } from 'vitest';

import type { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import type { AgentProviderRequest, AgentProviderResponse } from '../../../common/base/agents/providers/types';
import { classifyInboxDestination } from '../../services/classify-destination';

class StubAgentProvider implements AgentProvider {
    readonly name = 'stub';
    readonly defaultModel = 'stub-model';
    requests: AgentProviderRequest[] = [];

    constructor(private readonly respond: () => AgentProviderResponse) {}

    async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
        this.requests.push(request);
        return this.respond();
    }
}

function response(text: string): AgentProviderResponse {
    return { text, toolCalls: [], stopReason: 'end_turn' };
}

describe('classifyInboxDestination', () => {
    it('classifies a task-shaped text as tasks', async () => {
        const provider = new StubAgentProvider(() => response('tasks'));
        await expect(classifyInboxDestination(provider, 'Llamar al banco')).resolves.toBe('tasks');
    });

    it('classifies a money-shaped text as wallet', async () => {
        const provider = new StubAgentProvider(() => response('wallet'));
        await expect(classifyInboxDestination(provider, 'Pagué $5000 de luz')).resolves.toBe('wallet');
    });

    it('returns null when the model abstains', async () => {
        const provider = new StubAgentProvider(() => response('none'));
        await expect(classifyInboxDestination(provider, 'Ideas random')).resolves.toBeNull();
    });

    it('returns null on an unexpected response instead of throwing', async () => {
        const provider = new StubAgentProvider(() => response('no entiendo la pregunta'));
        await expect(classifyInboxDestination(provider, 'texto raro')).resolves.toBeNull();
    });

    it('never throws when the provider call fails', async () => {
        const provider: AgentProvider = {
            name: 'broken',
            defaultModel: 'broken-model',
            generate: async () => {
                throw new Error('rate limited');
            },
        };
        await expect(classifyInboxDestination(provider, 'algo')).resolves.toBeNull();
    });

    it('sends no tools and a single user message', async () => {
        const provider = new StubAgentProvider(() => response('tasks'));
        await classifyInboxDestination(provider, 'Comprar pan');

        expect(provider.requests[0].tools).toEqual([]);
        expect(provider.requests[0].messages).toEqual([{ role: 'user', content: 'Comprar pan' }]);
    });
});
