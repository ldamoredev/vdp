import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { HttpController } from '../common/http/HttpController';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';
import { ObjectivesModuleRuntime } from './ObjectivesModuleRuntime';

export class ObjectivesModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'objectives',
        label: 'Objectives',
    };

    private readonly runtime: ObjectivesModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.runtime = new ObjectivesModuleRuntime(context);
    }

    protected registerHandlers() {
        this.runtime.registerHandlers();
    }

    protected registerEventHandlers() {
        // D4a computes progress read-time in the web presenter; no backend subscriptions.
    }

    protected registerAgents() {
        // No Objectives agent in D4a.
    }

    getControllers(): HttpController[] {
        return this.runtime.createControllers();
    }

    getMiddlewares(): HttpMiddleWare[] {
        return [];
    }

    getDescriptor(): DomainModuleDescriptor {
        return ObjectivesModule.descriptor;
    }
}
