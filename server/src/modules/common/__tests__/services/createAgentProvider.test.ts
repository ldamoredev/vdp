import { describe, expect, it } from 'vitest';
import { createAgentProvider, resolveAgentProviderName } from '../../base/agents/providers/createAgentProvider';
import { AnthropicAgentProvider } from '../../base/agents/providers/AnthropicAgentProvider';
import { OllamaAgentProvider } from '../../base/agents/providers/OllamaAgentProvider';
import { OpenAICompatibleAgentProvider } from '../../base/agents/providers/OpenAICompatibleAgentProvider';

describe('createAgentProvider', () => {
    it('defaults to ollama when no provider or keys are configured', () => {
        const provider = createAgentProvider({});

        expect(provider).toBeInstanceOf(OllamaAgentProvider);
        expect(resolveAgentProviderName({})).toBe('ollama');
    });

    it('defaults to anthropic when an Anthropic key exists', () => {
        const provider = createAgentProvider({ ANTHROPIC_API_KEY: 'test-key' });

        expect(provider).toBeInstanceOf(AnthropicAgentProvider);
        expect(resolveAgentProviderName({ ANTHROPIC_API_KEY: 'test-key' })).toBe('anthropic');
    });

    it('defaults to openai-compatible when OPENAI_COMPAT_API_KEY exists', () => {
        const provider = createAgentProvider({
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
            OPENAI_COMPAT_BASE_URL: 'https://api.groq.com/openai',
        });

        expect(provider).toBeInstanceOf(OpenAICompatibleAgentProvider);
        expect(resolveAgentProviderName({ OPENAI_COMPAT_API_KEY: 'gsk_test-key' })).toBe('openai-compatible');
    });

    it('prefers openai-compatible over anthropic when both keys exist and no explicit provider', () => {
        const name = resolveAgentProviderName({
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
            ANTHROPIC_API_KEY: 'test-key',
        });

        expect(name).toBe('openai-compatible');
    });

    it('allows explicit provider override regardless of keys', () => {
        const provider = createAgentProvider({
            AGENT_PROVIDER: 'ollama',
            ANTHROPIC_API_KEY: 'test-key',
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
            OLLAMA_BASE_URL: 'http://localhost:11434',
        });

        expect(provider).toBeInstanceOf(OllamaAgentProvider);
        expect(resolveAgentProviderName({
            AGENT_PROVIDER: 'ollama',
            ANTHROPIC_API_KEY: 'test-key',
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
        })).toBe('ollama');
    });

    it('uses custom model for openai-compatible provider', () => {
        const provider = createAgentProvider({
            AGENT_PROVIDER: 'openai-compatible',
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
            OPENAI_COMPAT_BASE_URL: 'https://api.groq.com/openai',
            OPENAI_COMPAT_MODEL: 'gemma2-9b-it',
        });

        expect(provider).toBeInstanceOf(OpenAICompatibleAgentProvider);
        expect(provider.defaultModel).toBe('gemma2-9b-it');
    });

    it('defaults openai-compatible model to llama-3.3-70b-versatile', () => {
        const provider = createAgentProvider({
            AGENT_PROVIDER: 'openai-compatible',
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
            OPENAI_COMPAT_BASE_URL: 'https://api.groq.com/openai',
        });

        expect(provider.defaultModel).toBe('llama-3.3-70b-versatile');
    });

    it('throws when anthropic is forced without an api key', () => {
        expect(() => createAgentProvider({ AGENT_PROVIDER: 'anthropic' })).toThrow(
            'ANTHROPIC_API_KEY is required when AGENT_PROVIDER=anthropic',
        );
    });

    it('throws when openai-compatible is forced without an api key', () => {
        expect(() => createAgentProvider({ AGENT_PROVIDER: 'openai-compatible' })).toThrow(
            'OPENAI_COMPAT_API_KEY is required when AGENT_PROVIDER=openai-compatible',
        );
    });

    it('throws when openai-compatible is forced without a base url', () => {
        expect(() => createAgentProvider({
            AGENT_PROVIDER: 'openai-compatible',
            OPENAI_COMPAT_API_KEY: 'gsk_test-key',
        })).toThrow(
            'OPENAI_COMPAT_BASE_URL is required when AGENT_PROVIDER=openai-compatible',
        );
    });
});
