import { FastifyInstance } from 'fastify';
import { describe, expect, it } from 'vitest';

import { Core, CoreConfig } from '../../../Core';
import { AgentProvider } from '../../base/agents/providers/AgentProvider';
import { AgentProviderRequest, AgentProviderResponse } from '../../base/agents/providers/types';
import { RepositoryProvider } from '../../base/db/RepositoryProvider';
import { NoOpEmbeddingProvider } from '../../base/embeddings/NoOpEmbeddingProvider';
import { BaseModule } from '../../base/modules/BaseModule';
import { DomainModuleDescriptor } from '../../base/modules/DomainModuleDescriptor';
import { DomainModuleFactory } from '../../base/modules/DomainModuleFactory';
import { ModuleContext } from '../../base/modules/ModuleContext';
import { TraceService, TraceSpan } from '../../base/observability/trace/TraceService';
import { NoOpLangfuseLLMTraceService } from '../../infrastructure/observability/trace/langfuse/NoOpLangfuseLLMTraceService';
import { HttpController, RouteRegister } from '../../http/HttpController';
import { NoOpLogger } from '../../infrastructure/observability/logging/NoOpLogger';
import { AuthContextStorage } from '../../../auth/infrastructure/http/AuthContextStorage';
import { HttpMiddleWare } from '../../http/HttpMiddleWare';

class FakeRepositoryProvider extends RepositoryProvider {
    protected create<T>(_token: abstract new (...args: any[]) => T): T {
        throw new Error('No repositories registered for this test');
    }
}

class FakeAgentProvider implements AgentProvider {
    readonly name = 'fake';
    readonly defaultModel = 'fake-model';

    async generate(_request: AgentProviderRequest): Promise<AgentProviderResponse> {
        return {
            text: '',
            toolCalls: [],
            stopReason: 'stop',
        };
    }
}

class RecordingTraceService implements TraceService {
    readonly enabled = false;
    public starts = 0;
    public shutdowns = 0;

    async start(): Promise<void> {
        this.starts += 1;
    }

    async shutdown(): Promise<void> {
        this.shutdowns += 1;
    }

    async runWithSpan<T>(
        _name: string,
        _options: { attributes?: Record<string, string | number | boolean | undefined> },
        callback: (span: TraceSpan) => Promise<T> | T,
    ): Promise<T> {
        const span: TraceSpan = {
            setAttribute: () => {},
            setAttributes: () => {},
        };

        return callback(span);
    }
}

class RecordingController extends HttpController {
    readonly prefix = '/test';

    constructor(public readonly id: string) {
        super();
    }

    registerRoutes(_routes: RouteRegister): void {}
}

class RecordingModule extends BaseModule {
    constructor(
        context: ModuleContext,
        private readonly descriptor: DomainModuleDescriptor,
        private readonly order: string[],
    ) {
        super(context);
    }

    protected registerServices(): void {
        this.order.push(`${this.descriptor.domain}:services`);
    }

    protected registerEventHandlers(): void {
        this.order.push(`${this.descriptor.domain}:events`);
    }

    protected registerAgents(): void {
        this.order.push(`${this.descriptor.domain}:agents`);
    }

    getControllers(): HttpController[] {
        return [new RecordingController(this.descriptor.domain)];
    }

    getMiddlewares(): HttpMiddleWare[] {
        return [];
    }

    getDescriptor(): DomainModuleDescriptor {
        return this.descriptor;
    }
}

function createConfig(
    traceService: RecordingTraceService,
    moduleFactories: DomainModuleFactory[],
): CoreConfig {
    return {
        repositoryProvider: new FakeRepositoryProvider(),
        llmTraceService: new NoOpLangfuseLLMTraceService(),
        traceService,
        agentProvider: new FakeAgentProvider(),
        embeddingProvider: new NoOpEmbeddingProvider(),
        moduleFactories,
        logger: new NoOpLogger(),
        authContextStorage: new AuthContextStorage(),
    };
}

describe('Core', () => {
    it('bootstraps modules from configuration in factory order', () => {
        const order: string[] = [];
        const traceService = new RecordingTraceService();
        const config = createConfig(traceService, [
            (context) =>
                new RecordingModule(context, { domain: 'tasks', label: 'Tasks' }, order),
            (context) =>
                new RecordingModule(context, { domain: 'health', label: 'Health' }, order),
        ]);

        const core = new Core(config);

        expect(order).toEqual([
            'tasks:services',
            'tasks:events',
            'tasks:agents',
            'health:services',
            'health:events',
            'health:agents',
        ]);
        expect(core.getControllers()).toHaveLength(2);
        expect(core.getModuleDescriptors()).toEqual([
            { domain: 'tasks', label: 'Tasks' },
            { domain: 'health', label: 'Health' },
        ]);
    });

    it('delegates runtime lifecycle to the configured trace service', async () => {
        const traceService = new RecordingTraceService();
        const core = new Core(
            createConfig(traceService, [
                (context) =>
                    new RecordingModule(context, { domain: 'tasks', label: 'Tasks' }, []),
            ]),
        );

        await core.start();
        await core.shutdown();

        expect(traceService.starts).toBe(1);
        expect(traceService.shutdowns).toBe(1);
    });
});
