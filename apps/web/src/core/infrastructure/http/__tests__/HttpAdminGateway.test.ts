import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type { AppSettings } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { HttpAdminGateway } from "../HttpAdminGateway";

interface RecordedCall {
  method: HttpMethods;
  url: string;
  body: unknown;
}

class FakeHttpClient implements HttpClient {
  readonly calls: RecordedCall[] = [];
  constructor(private readonly responses: Record<string, unknown> = {}) {}

  get<T = any>(url: string) {
    return this.record<T>(HttpMethods.GET, url, undefined);
  }

  post<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.POST, url, body);
  }

  put<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PUT, url, body);
  }

  patch<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PATCH, url, body);
  }

  delete<T = any>(url: string) {
    return this.record<T>(HttpMethods.DELETE, url, undefined);
  }

  head<T = any>(url: string) {
    return this.record<T>(HttpMethods.HEAD, url, undefined);
  }

  send<T = any>(request: HttpRequest) {
    return this.record<T>(request.method, request.url, request.body);
  }

  addInterceptor() {}

  private async record<T>(method: HttpMethods, url: string, body: unknown): Promise<HttpResponse<T>> {
    this.calls.push({ method, url, body });
    return {
      method,
      url,
      status: 200,
      statusText: "OK",
      headers: {},
      body: (this.responses[`${method} ${url}`] ?? {}) as T,
      request: new HttpRequest(method, url, body),
    };
  }
}

const settings: AppSettings = {
  registrationEnabled: true,
  chatEnabledForUsers: false,
};

describe("HttpAdminGateway", () => {
  it("gets settings", async () => {
    const http = new FakeHttpClient({ "GET /admin/settings": settings });

    const result = await new HttpAdminGateway(http).getSettings();

    expect(result).toEqual(settings);
    expect(http.calls[0]).toMatchObject({ method: HttpMethods.GET, url: "/admin/settings" });
  });

  it("updates settings with the expected body", async () => {
    const http = new FakeHttpClient({ "PUT /admin/settings": settings });

    const result = await new HttpAdminGateway(http).updateSettings({ chatEnabledForUsers: false });

    expect(result).toEqual(settings);
    expect(http.calls[0]).toMatchObject({
      method: HttpMethods.PUT,
      url: "/admin/settings",
      body: { chatEnabledForUsers: false },
    });
  });
});
