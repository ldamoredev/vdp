import { SpanOptions, TraceService, TraceSpan } from '../../../../base/observability/trace/TraceService';

export class NoOpOpenTelemetryService implements TraceService {
    private noopSpan: TraceSpan = {
        setAttribute: () => {
        },
        setAttributes: () => {
        },
    };

    readonly enabled = false;

    async start(): Promise<void> {
    }

    async shutdown(): Promise<void> {
    }

    async runWithSpan<T>(
        _name: string,
        _options: SpanOptions,
        callback: (span: TraceSpan) => Promise<T> | T,
    ): Promise<T> {
        return callback(this.noopSpan);
    }
}

