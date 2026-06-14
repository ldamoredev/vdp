import { AgentProvider } from './AgentProvider';
import { AnthropicAgentProvider } from './AnthropicAgentProvider';
import { OllamaAgentProvider } from './OllamaAgentProvider';
import { OpenAICompatibleAgentProvider } from './OpenAICompatibleAgentProvider';

export type AgentProviderName = 'anthropic' | 'ollama' | 'openai-compatible';
export type AgentChatUnavailableReason =
    | 'agent_provider_not_configured'
    | 'anthropic_not_configured'
    | 'openai_compatible_not_configured'
    | 'ollama_not_configured';

export type AgentChatAvailability =
    | { enabled: true }
    | { enabled: false; reason: AgentChatUnavailableReason };

function hasValue(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
}

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

export function resolveAgentChatAvailability(
    env: Record<string, string | undefined> = process.env,
): AgentChatAvailability {
    const provider = env.AGENT_PROVIDER;

    if (provider === 'anthropic') {
        return hasValue(env.ANTHROPIC_API_KEY)
            ? { enabled: true }
            : { enabled: false, reason: 'anthropic_not_configured' };
    }

    if (provider === 'openai-compatible') {
        return hasValue(env.OPENAI_COMPAT_API_KEY) && hasValue(env.OPENAI_COMPAT_BASE_URL)
            ? { enabled: true }
            : { enabled: false, reason: 'openai_compatible_not_configured' };
    }

    if (provider === 'ollama') {
        return hasValue(env.OLLAMA_BASE_URL)
            ? { enabled: true }
            : { enabled: false, reason: 'ollama_not_configured' };
    }

    if (hasValue(env.OPENAI_COMPAT_API_KEY) && hasValue(env.OPENAI_COMPAT_BASE_URL)) {
        return { enabled: true };
    }

    if (hasValue(env.ANTHROPIC_API_KEY)) {
        return { enabled: true };
    }

    return { enabled: false, reason: 'agent_provider_not_configured' };
}
