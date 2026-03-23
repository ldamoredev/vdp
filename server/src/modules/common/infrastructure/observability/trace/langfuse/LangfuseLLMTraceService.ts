import { Langfuse } from 'langfuse';
import { Trace, TraceParams, LLMTraceService } from '../../../../base/observability/trace/LLMTraceService';
import { NoOpLangfuseLLMTraceService } from './NoOpLangfuseLLMTraceService';
import { Logger } from '../../../../base/observability/logging/Logger';
import { NoOpLogger } from '../../logging/NoOpLogger';

export class LangfuseLLMTraceService implements LLMTraceService {
    private client: Langfuse;

    constructor(publicKey: string, secretKey: string, host?: string) {
        this.client = new Langfuse({
            publicKey,
            secretKey,
            baseUrl: host,
        });
    }

    createTrace(params: TraceParams): Trace {
        const trace = this.client.trace({
            name: params.name,
            metadata: params.metadata,
        });

        return {
            id: trace.id,
            generation: (gParams) => {
                const gen = trace.generation({
                    name: gParams.name,
                    model: gParams.model,
                    input: gParams.input,
                    metadata: gParams.metadata,
                });
                return {
                    end: (endParams) => {
                        gen.end({
                            output: endParams?.output,
                            usage: endParams?.usage
                                ? {
                                    input: endParams.usage.inputTokens,
                                    output: endParams.usage.outputTokens,
                                }
                                : undefined,
                        });
                    },
                };
            },
            span: (sParams) => {
                const span = trace.span({
                    name: sParams.name,
                    metadata: sParams.metadata,
                });
                return {
                    end: () => span.end(),
                };
            },
            update: (uParams) => {
                trace.update(uParams);
            },
        };
    }

    async flush(): Promise<void> {
        await this.client.flushAsync();
    }

    async shutdown(): Promise<void> {
        await this.client.shutdownAsync();
    }
}

export function createLangfuseService(
    env: NodeJS.ProcessEnv,
    logger: Logger = new NoOpLogger(),
): LLMTraceService {
    const publicKey = env.LANGFUSE_PUBLIC_KEY;
    const secretKey = env.LANGFUSE_SECRET_KEY;

    if (publicKey && secretKey) {
        logger.info('langfuse initialized');
        return new LangfuseLLMTraceService(publicKey, secretKey, env.LANGFUSE_HOST);
    }

    logger.info('langfuse disabled; using noop client');
    return new NoOpLangfuseLLMTraceService();
}
