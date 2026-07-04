import type { AppSettings } from "@vdp/shared";

import type { AdminGateway } from "../../../../domain/admin/AdminGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

export class FakeAdminGateway implements AdminGateway {
  readonly calls: RecordedCall[] = [];
  settings: AppSettings = {
    registrationEnabled: true,
    chatEnabledForUsers: true,
  };

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  async getSettings(): Promise<AppSettings> {
    this.calls.push({ method: "getSettings", args: [] });
    return { ...this.settings };
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    this.calls.push({ method: "updateSettings", args: [patch] });
    this.settings = { ...this.settings, ...patch };
    return { ...this.settings };
  }
}
