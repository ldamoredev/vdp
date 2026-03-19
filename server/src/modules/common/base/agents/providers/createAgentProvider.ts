import { AgentProvider } from './AgentProvider';
import { AnthropicAgentProvider } from './AnthropicAgentProvider';
import { OllamaAgentProvider } from './OllamaAgentProvider';

export type AgentProviderName = 'anthropic' | 'ollama';

export function resolveAgentProviderName(env = process.env): AgentProviderName {
    const provider = env.AGENT_PROVIDER;

    if (provider === 'anthropic' || provider === 'ollama') {
        return provider;
    }

    return env.ANTHROPIC_API_KEY ? 'anthropic' : 'ollama';
}

export function createAgentProvider(env = process.env): AgentProvider {
    switch (resolveAgentProviderName(env)) {
        case 'anthropic':
            return new AnthropicAgentProvider(env.ANTHROPIC_API_KEY);
        case 'ollama':
        default:
            return new OllamaAgentProvider(env.OLLAMA_BASE_URL);
    }
}
