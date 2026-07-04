import type { AppSettings } from "@vdp/shared";
import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { AdminGateway } from "../../domain/admin/AdminGateway";

export class GetAppSettings extends Query<AppSettings> {}

export class GetAppSettingsHandler implements RequestHandler<GetAppSettings, AppSettings> {
  constructor(private readonly gateway: AdminGateway) {}

  async handle(): Promise<AppSettings> {
    return this.gateway.getSettings();
  }
}
