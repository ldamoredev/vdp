import { AgentProvider } from './AgentProvider';
import { AnthropicAgentProvider } from './AnthropicAgentProvider';
import { OllamaAgentProvider } from './OllamaAgentProvider';
import { OpenAICompatibleAgentProvider } from './OpenAICompatibleAgentProvider';

export type AgentProviderName = 'anthropic' | 'ollama' | 'openai-compatible';

export function resolveAgentProviderName(env: Record<string, string | undefined> = process.env): AgentProviderName {
    const provider = env.AGENT_PROVIDER;

    if (provider === 'anthropic' || provider === 'ollama' || provider === 'openai-compatible') {
        return provider;
    }

    if (env.OPENAI_COMPAT_API_KEY) return 'openai-compatible';
    if (env.ANTHROPIC_API_KEY) return 'anthropic';
    return 'ollama';
}

export function createAgentProvider(env: Record<string, string | undefined> = process.env): AgentProvider {
    switch (resolveAgentProviderName(env)) {
        case 'anthropic':
            return new AnthropicAgentProvider(env.ANTHROPIC_API_KEY);
        case 'openai-compatible':
            return new OpenAICompatibleAgentProvider({
                baseUrl: env.OPENAI_COMPAT_BASE_URL ?? '',
                apiKey: env.OPENAI_COMPAT_API_KEY ?? '',
                model: env.OPENAI_COMPAT_MODEL ?? 'llama-3.3-70b-versatile',
            });
        case 'ollama':
        default:
            return new OllamaAgentProvider(env.OLLAMA_BASE_URL);
    }
}
