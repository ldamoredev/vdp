import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { SpanAttributeValue, SpanOptions, TraceService, TraceSpan } from '../../../../base/observability/trace/TraceService';
import { NoOpOpenTelemetryService } from './NoOpOpenTelemetryService';
import { Logger } from '../../../../base/observability/logging/Logger';
import { NoOpLogger } from '../../logging/NoOpLogger';

export class OpenTelemetryService implements TraceService {
    readonly enabled = true;
    private sdk: NodeSDK;
    private started = false;

    constructor(
        private readonly config: {
            serviceName: string;
            tracesEndpoint?: string;
            logger: Logger;
        },
    ) {
        this.sdk = new NodeSDK({
            serviceName: config.serviceName,
            traceExporter: new OTLPTraceExporter(
                config.tracesEndpoint ? { url: config.tracesEndpoint } : undefined,
            ),
            instrumentations: [
                getNodeAutoInstrumentations({
                    '@opentelemetry/instrumentation-http': { enabled: true },
                    '@opentelemetry/instrumentation-fastify': { enabled: true },
                    '@opentelemetry/instrumentation-pg': { enabled: true },
                }),
            ],
        });
    }

    async start(): Promise<void> {
        if (this.started) {
            return;
        }

        this.sdk.start();
        this.started = true;
        this.config.logger.info('opentelemetry initialized', {
            serviceName: this.config.serviceName,
            tracesEndpoint: this.config.tracesEndpoint,
        });
    }

    async shutdown(): Promise<void> {
        if (!this.started) {
            return;
        }

        await this.sdk.shutdown();
        this.started = false;
    }

    async runWithSpan<T>(
        name: string,
        options: SpanOptions,
        callback: (span: TraceSpan) => Promise<T> | T,
    ): Promise<T> {
        const tracer = trace.getTracer(this.config.serviceName);

        return tracer.startActiveSpan(
            name,
            { attributes: this.sanitizeAttributes(options.attributes) },
            async (span) => {
                const wrappedSpan = new OpenTelemetryTraceSpan(span);

                try {
                    const result = await callback(wrappedSpan);
                    span.setStatus({ code: SpanStatusCode.OK });
                    return result;
                } catch (err) {
                    const error = this.normalizeError(err);
                    span.recordException(error);
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: error.message,
                    });
                    throw err;
                } finally {
                    span.end();
                }
            },
        );
    }

    private sanitizeAttributes(attributes?: Record<string, SpanAttributeValue | undefined>) {
        if (!attributes) {
            return undefined;
        }

        return Object.fromEntries(
            Object.entries(attributes).filter((entry): entry is [string, SpanAttributeValue] => entry[1] !== undefined),
        );
    }

    private normalizeError(err: unknown): Error {
        if (err instanceof Error) {
            return err;
        }

        return new Error(typeof err === 'string' ? err : 'Unknown telemetry error');
    }
}

export class OpenTelemetryTraceSpan implements TraceSpan {
    constructor(private span: { setAttribute(key: string, value: SpanAttributeValue): void }) {
    }

    setAttribute(key: string, value: SpanAttributeValue | undefined): void {
        if (value === undefined) {
            return;
        }

        this.span.setAttribute(key, value);
    }

    setAttributes(attributes: Record<string, SpanAttributeValue | undefined>): void {
        for (const [key, value] of Object.entries(attributes)) {
            this.setAttribute(key, value);
        }
    }
}

export function createOpenTelemetryService(
    env: NodeJS.ProcessEnv,
    logger: Logger = new NoOpLogger(),
): TraceService {
    const enabled =
        env.OTEL_ENABLED === 'true' ||
        Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT) ||
        Boolean(env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);

    if (!enabled) {
        logger.info('opentelemetry disabled; using noop service');
        return new NoOpOpenTelemetryService();
    }

    let endpoint = env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? env.OTEL_EXPORTER_OTLP_ENDPOINT;
    endpoint = endpoint?.endsWith('/v1/traces')
        ? endpoint
        : `${endpoint?.replace(/\/$/, '')}/v1/traces`;


    return new OpenTelemetryService({
        serviceName: env.OTEL_SERVICE_NAME || 'vdp-server',
        tracesEndpoint: endpoint,
        logger,
    });
}
