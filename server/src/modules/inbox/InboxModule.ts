import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { HttpController } from '../common/http/HttpController';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';
import { InboxModuleRuntime } from './InboxModuleRuntime';

export class InboxModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'inbox',
        label: 'Inbox',
    };

    private readonly runtime: InboxModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.runtime = new InboxModuleRuntime(context);
    }

    protected registerHandlers() {
        this.runtime.registerHandlers();
    }

    protected registerEventHandlers() {
        // D5a is capture + queue only; triage routing (D5b) stays in the web presenter.
    }

    protected registerAgents() {
        // No Inbox agent.
    }

    getControllers(): HttpController[] {
        return this.runtime.createControllers();
    }

    getMiddlewares(): HttpMiddleWare[] {
        return [];
    }

    getDescriptor(): DomainModuleDescriptor {
        return InboxModule.descriptor;
    }
}
