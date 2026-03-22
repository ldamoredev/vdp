import { describe, expect, it } from 'vitest';
import {
    createOpenTelemetryService,
    OpenTelemetryService,
} from '../../infrastructure/observability/trace/opentelemetry/OpenTelemetryService';
import { NoOpOpenTelemetryService } from '../../infrastructure/observability/trace/opentelemetry/NoOpOpenTelemetryService';

describe('NoopOpenTelemetryService', () => {
    it('runs callbacks without tracing side effects', async () => {
        const service = new NoOpOpenTelemetryService();

        const result = await service.runWithSpan(
            'test.span',
            { attributes: { provider: 'ollama' } },
            async (span) => {
                span.setAttribute('stop_reason', 'stop');
                span.setAttributes({ model: 'llama3.2' });
                return 'ok';
            },
        );

        expect(result).toBe('ok');
        await expect(service.start()).resolves.toBeUndefined();
        await expect(service.shutdown()).resolves.toBeUndefined();
    });
});

describe('createOpenTelemetryService', () => {
    it('returns NoopOpenTelemetryService when tracing is not configured', () => {
        const service = createOpenTelemetryService({});

        expect(service).toBeInstanceOf(NoOpOpenTelemetryService);
    });

    it('returns RealOpenTelemetryService when OTEL is explicitly enabled', () => {
        const service = createOpenTelemetryService({
            OTEL_ENABLED: 'true',
            OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        });

        expect(service).toBeInstanceOf(OpenTelemetryService);
    });

    it('returns RealOpenTelemetryService when an OTLP endpoint is configured', () => {
        const service = createOpenTelemetryService({
            OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        });

        expect(service).toBeInstanceOf(OpenTelemetryService);
    });
});
