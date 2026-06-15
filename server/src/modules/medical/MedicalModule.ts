import { HttpController } from "../common/http/HttpController";
import { BaseModule } from "../common/base/modules/BaseModule";
import { DomainModuleDescriptor } from "../common/base/modules/DomainModuleDescriptor";
import { ModuleContext } from "../common/base/modules/ModuleContext";
import { HttpMiddleWare } from "../common/http/HttpMiddleWare";
import { MedicalModuleRuntime } from "./MedicalModuleRuntime";

export class MedicalModule extends BaseModule {
  private static readonly descriptor: DomainModuleDescriptor = {
    domain: "medical",
    label: "Medical",
  };

  private readonly runtime: MedicalModuleRuntime;

  constructor(context: ModuleContext) {
    super(context);
    this.runtime = new MedicalModuleRuntime(context);
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
    return MedicalModule.descriptor;
  }
}
