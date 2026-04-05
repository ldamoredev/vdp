import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { AuthModuleRuntime } from './AuthModuleRuntime';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';

export class AuthModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'auth',
        label: 'auth',
    };
    private readonly runtime: AuthModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.runtime = new AuthModuleRuntime({ ...context });
    }

    getControllers(): HttpController[] {
        return this.runtime.createControllers();
    }

    protected registerServices() {
        this.runtime.registerServices();
    }

    protected registerEventHandlers() {
    }

    protected registerAgents() {
    }

    getMiddlewares(): HttpMiddleWare[] {
        return this.runtime.createMiddlewares();
    }

    getDescriptor(): DomainModuleDescriptor {
        return AuthModule.descriptor;
    }
}
