import { AgentProvider } from '../../../common/base/agents/providers/AgentProvider';
import {
    AgentProviderRequest,
    AgentProviderResponse,
} from '../../../common/base/agents/providers/types';

/**
 * Deterministic LLM provider stand-in for agent e2e tests.
 *
 * It replays a scripted list of responses so the real agent chat loop, tool
 * dispatch, auth-context propagation, and persistence all run for real — only
 * the model call is faked. Once the script is exhausted it returns a terminal
 * text response so the loop always ends.
 */
export class ScriptedAgentProvider implements AgentProvider {
    readonly name = 'scripted';
    readonly defaultModel = 'scripted-model';
    readonly calls: AgentProviderRequest[] = [];

    constructor(private readonly responses: AgentProviderResponse[]) {}

    async generate(request: AgentProviderRequest): Promise<AgentProviderResponse> {
        this.calls.push(request);
        return (
            this.responses.shift() ?? {
                text: 'Listo.',
                toolCalls: [],
                stopReason: 'end_turn',
            }
        );
    }
}

/** Reassign an agent's protected provider field for the duration of a test. */
export function withScriptedProvider(
    agent: object,
    provider: AgentProvider,
): { restore: () => void } {
    const holder = agent as { provider: AgentProvider };
    const original = holder.provider;
    holder.provider = provider;
    return { restore: () => { holder.provider = original; } };
}
