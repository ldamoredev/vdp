import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { HealthModuleRuntime } from './HealthModuleRuntime';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';

export class HealthModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'health',
        label: 'Health',
    };

    private readonly runtime: HealthModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.runtime = new HealthModuleRuntime(context);
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
        return HealthModule.descriptor;
    }
}
