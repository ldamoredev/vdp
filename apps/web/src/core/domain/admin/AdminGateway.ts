import type { AppSettings } from "@vdp/shared";

export interface AdminGateway {
  getSettings(): Promise<AppSettings>;
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>;
}
