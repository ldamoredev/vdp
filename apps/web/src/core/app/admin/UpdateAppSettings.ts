import type { AppSettings } from "@vdp/shared";
import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { AdminGateway } from "../../domain/admin/AdminGateway";

export class UpdateAppSettings extends Command<AppSettings> {
  constructor(readonly patch: Partial<AppSettings>) {
    super();
  }
}

export class UpdateAppSettingsHandler implements RequestHandler<UpdateAppSettings, AppSettings> {
  constructor(private readonly gateway: AdminGateway) {}

  async handle(command: UpdateAppSettings): Promise<AppSettings> {
    return this.gateway.updateSettings(command.patch);
  }
}
