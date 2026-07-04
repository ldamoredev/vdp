import { HttpClient } from "@nbottarini/abstract-http-client";
import type { AppSettings } from "@vdp/shared";

import type { AdminGateway } from "../../domain/admin/AdminGateway";

const P = "/admin/settings";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly http: HttpClient) {}

  async getSettings(): Promise<AppSettings> {
    const { body } = await this.http.get<AppSettings>(P);
    return body;
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const { body } = await this.http.put<AppSettings>(P, patch);
    return body;
  }
}
