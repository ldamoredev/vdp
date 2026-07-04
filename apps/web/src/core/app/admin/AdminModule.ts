import type { Core, CoreModule } from "../../Core";
import type { AdminGateway } from "../../domain/admin/AdminGateway";
import { HttpAdminGateway } from "../../infrastructure/http/HttpAdminGateway";
import { GetAppSettings, GetAppSettingsHandler } from "./GetAppSettings";
import { UpdateAppSettings, UpdateAppSettingsHandler } from "./UpdateAppSettings";

export class AdminModule implements CoreModule {
  constructor(private readonly gateway?: AdminGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpAdminGateway(core.httpClient);

    core.bus.registerHandler(GetAppSettings, () => new GetAppSettingsHandler(gateway));
    core.bus.registerHandler(UpdateAppSettings, () => new UpdateAppSettingsHandler(gateway));
  }
}
