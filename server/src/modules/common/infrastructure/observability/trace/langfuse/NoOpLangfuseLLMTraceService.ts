import { TraceGeneration, TraceSpan, Trace, TraceParams, LLMTraceService } from '../../../../base/observability/trace/LLMTraceService';


export class NoOpLangfuseLLMTraceService implements LLMTraceService {
    private noopGeneration: TraceGeneration = { end: () => {} };
    private noopSpan: TraceSpan = { end: () => {} };

    createTrace(_params: TraceParams): Trace {
        return {
            id: 'noop',
            generation: () => this.noopGeneration,
            span: () => this.noopSpan,
            update: () => {
            },
        };
    }

    async flush(): Promise<void> {
    }

    async shutdown(): Promise<void> {
    }
}