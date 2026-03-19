import { describe, expect, it } from 'vitest';
import { createAgentProvider, resolveAgentProviderName } from '../../base/agents/providers/createAgentProvider';
import { AnthropicAgentProvider } from '../../base/agents/providers/AnthropicAgentProvider';
import { OllamaAgentProvider } from '../../base/agents/providers/OllamaAgentProvider';

describe('createAgentProvider', () => {
    it('defaults to ollama when no provider or Anthropic key is configured', () => {
        const provider = createAgentProvider({});

        expect(provider).toBeInstanceOf(OllamaAgentProvider);
        expect(resolveAgentProviderName({})).toBe('ollama');
    });

    it('defaults to anthropic when an Anthropic key exists', () => {
        const provider = createAgentProvider({ ANTHROPIC_API_KEY: 'test-key' });

        expect(provider).toBeInstanceOf(AnthropicAgentProvider);
        expect(resolveAgentProviderName({ ANTHROPIC_API_KEY: 'test-key' })).toBe('anthropic');
    });

    it('allows explicit ollama override even when an Anthropic key exists', () => {
        const provider = createAgentProvider({
            AGENT_PROVIDER: 'ollama',
            ANTHROPIC_API_KEY: 'test-key',
            OLLAMA_BASE_URL: 'http://localhost:11434',
        });

        expect(provider).toBeInstanceOf(OllamaAgentProvider);
        expect(resolveAgentProviderName({
            AGENT_PROVIDER: 'ollama',
            ANTHROPIC_API_KEY: 'test-key',
        })).toBe('ollama');
    });

    it('throws when anthropic is forced without an api key', () => {
        expect(() => createAgentProvider({ AGENT_PROVIDER: 'anthropic' })).toThrow(
            'ANTHROPIC_API_KEY is required when AGENT_PROVIDER=anthropic',
        );
    });
});
