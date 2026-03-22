export interface LLMTraceService {
    createTrace(params: TraceParams): Trace;
    flush(): Promise<void>;
    shutdown(): Promise<void>;
}

export interface Trace {
    id: string;
    generation(params: GenerationParams): TraceGeneration;
    span(params: SpanParams): TraceSpan;
    update(params: Record<string, unknown>): void;
}

export type TraceParams = {
    name: string;
    metadata?: Record<string, unknown>;
};

export interface TraceGeneration {
    end(params?: GenerationEndParams): void;
}

export interface TraceSpan {
    end(params?: Record<string, unknown>): void;
}

export type GenerationParams = {
    name: string;
    model?: string;
    input?: unknown;
    metadata?: Record<string, unknown>;
};

export type GenerationEndParams = {
    output?: unknown;
    usage?: { inputTokens?: number; outputTokens?: number };
};

export type SpanParams = {
    name: string;
    metadata?: Record<string, unknown>;
};
