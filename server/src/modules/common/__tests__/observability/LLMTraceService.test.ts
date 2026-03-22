import { describe, expect, it } from 'vitest';
import {
    createLangfuseService,
    LangfuseLLMTraceService,
} from '../../infrastructure/observability/trace/langfuse/LangfuseLLMTraceService';
import { NoOpLangfuseLLMTraceService } from '../../infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';

describe('NoopLangfuseService', () => {
    it('createTrace returns a noop trace with id "noop"', () => {
        const service = new NoOpLangfuseLLMTraceService();
        const trace = service.createTrace({ name: 'test' });

        expect(trace.id).toBe('noop');
    });

    it('trace.generation returns a noop generation that can be ended', () => {
        const service = new NoOpLangfuseLLMTraceService();
        const trace = service.createTrace({ name: 'test' });
        const gen = trace.generation({ name: 'gen' });

        expect(() => gen.end()).not.toThrow();
        expect(() => gen.end({ output: 'result', usage: { inputTokens: 10, outputTokens: 20 } })).not.toThrow();
    });

    it('trace.span returns a noop span that can be ended', () => {
        const service = new NoOpLangfuseLLMTraceService();
        const trace = service.createTrace({ name: 'test' });
        const span = trace.span({ name: 'span' });

        expect(() => span.end()).not.toThrow();
    });

    it('trace.update does not throw', () => {
        const service = new NoOpLangfuseLLMTraceService();
        const trace = service.createTrace({ name: 'test' });

        expect(() => trace.update({ output: 'done' })).not.toThrow();
    });

    it('flush and shutdown resolve without error', async () => {
        const service = new NoOpLangfuseLLMTraceService();

        await expect(service.flush()).resolves.toBeUndefined();
        await expect(service.shutdown()).resolves.toBeUndefined();
    });
});

describe('createLangfuseService', () => {
    it('returns NoopLangfuseService when no keys are provided', () => {
        const service = createLangfuseService({});

        expect(service).toBeInstanceOf(NoOpLangfuseLLMTraceService);
    });

    it('returns NoopLangfuseService when only public key is provided', () => {
        const service = createLangfuseService({ LANGFUSE_PUBLIC_KEY: 'pk-test' });

        expect(service).toBeInstanceOf(NoOpLangfuseLLMTraceService);
    });

    it('returns RealLangfuseService when both keys are provided', () => {
        const service = createLangfuseService({
            LANGFUSE_PUBLIC_KEY: 'pk-test',
            LANGFUSE_SECRET_KEY: 'sk-test',
        });

        expect(service).toBeInstanceOf(LangfuseLLMTraceService);
    });

    it('returns RealLangfuseService with custom host', () => {
        const service = createLangfuseService({
            LANGFUSE_PUBLIC_KEY: 'pk-test',
            LANGFUSE_SECRET_KEY: 'sk-test',
            LANGFUSE_HOST: 'https://custom.langfuse.com',
        });

        expect(service).toBeInstanceOf(LangfuseLLMTraceService);
    });
});
