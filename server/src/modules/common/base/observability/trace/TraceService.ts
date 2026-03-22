export interface TraceService {
    readonly enabled: boolean;
    start(): Promise<void>;
    shutdown(): Promise<void>;
    runWithSpan<T>(
        name: string,
        options: SpanOptions,
        callback: (span: TraceSpan) => Promise<T> | T,
    ): Promise<T>;
}

export interface TraceSpan {
    setAttribute(key: string, value: SpanAttributeValue | undefined): void;
    setAttributes(attributes: Record<string, SpanAttributeValue | undefined>): void;
}

export type SpanAttributeValue = string | number | boolean;

export type SpanOptions = {
    attributes?: Record<string, SpanAttributeValue | undefined>;
};

