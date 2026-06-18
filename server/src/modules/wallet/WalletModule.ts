import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { WalletModuleRuntime } from './WalletModuleRuntime';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';
import { WalletInsightsStore } from './services/WalletInsightsStore';
import { WalletInsightRepository } from './domain/WalletInsightRepository';

export class WalletModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'wallet',
        label: 'Wallet',
    };
    private readonly runtime: WalletModuleRuntime;
    private readonly insightsStore: WalletInsightsStore;

    constructor(context: ModuleContext) {
        super(context);
        this.insightsStore = new WalletInsightsStore(
            context.repositories.get(WalletInsightRepository),
            this.logger,
        );
        this.runtime = new WalletModuleRuntime({
            ...context,
            insightsStore: this.insightsStore,
        });
    }

    async start(): Promise<void> {
        await this.runtime.rehydrateInsights();
    }

    protected registerServices() {
        this.runtime.registerServices();
    }

    protected registerHandlers() {
        this.runtime.registerHandlers();
    }

    protected registerEventHandlers() {
        this.runtime.registerEventHandlers();
    }

    protected registerAgents() {
        this.runtime.registerAgent();
    }

    getControllers(): HttpController[] {
        return this.runtime.createControllers();
    }

    getMiddlewares(): HttpMiddleWare[] {
        return [];
    }

    getDescriptor(): DomainModuleDescriptor {
        return WalletModule.descriptor;
    }
}
