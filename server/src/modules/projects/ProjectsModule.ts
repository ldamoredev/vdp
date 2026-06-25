import { HttpController } from '../common/http/HttpController';
import { BaseModule } from '../common/base/modules/BaseModule';
import { DomainModuleDescriptor } from '../common/base/modules/DomainModuleDescriptor';
import { ModuleContext } from '../common/base/modules/ModuleContext';
import { HttpMiddleWare } from '../common/http/HttpMiddleWare';
import { ProjectsModuleRuntime } from './ProjectsModuleRuntime';

export class ProjectsModule extends BaseModule {
    private static readonly descriptor: DomainModuleDescriptor = {
        domain: 'projects',
        label: 'Projects',
    };

    private readonly runtime: ProjectsModuleRuntime;

    constructor(context: ModuleContext) {
        super(context);
        this.runtime = new ProjectsModuleRuntime(context);
    }

    protected registerHandlers() {
        this.runtime.registerHandlers();
    }

    protected registerEventHandlers() {
        // Projects owns direction only in D3a; no cross-domain subscriptions yet.
    }

    protected registerAgents() {
        // No Projects agent in D3a.
    }

    getControllers(): HttpController[] {
        return this.runtime.createControllers();
    }

    getMiddlewares(): HttpMiddleWare[] {
        return [];
    }

    getDescriptor(): DomainModuleDescriptor {
        return ProjectsModule.descriptor;
    }
}
