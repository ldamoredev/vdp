import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { WalletModuleRuntime } from './WalletModuleRuntime';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';
import { WalletInsightsStore } from './services/WalletInsightsStore';

export class WalletModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'wallet',
        label: 'Wallet',
    };
    private readonly runtime: WalletModuleRuntime;
    private readonly insightsStore: WalletInsightsStore;

    constructor(context: ModuleContext) {
        super(context);
        this.insightsStore = new WalletInsightsStore();
        this.runtime = new WalletModuleRuntime({
            ...context,
            insightsStore: this.insightsStore,
        });
    }

    protected registerServices() {
        this.runtime.registerServices();
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
