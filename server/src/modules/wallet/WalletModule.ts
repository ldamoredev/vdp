import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { WalletModuleRuntime } from './WalletModuleRuntime';

export class WalletModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'wallet',
        label: 'Wallet',
    };
    private readonly runtime: WalletModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.runtime = new WalletModuleRuntime(context);
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

    getDescriptor(): DomainModuleDescriptor {
        return WalletModule.descriptor;
    }
}
