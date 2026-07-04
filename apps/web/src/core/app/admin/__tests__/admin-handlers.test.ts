import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { AdminModule } from "../AdminModule";
import { GetAppSettings } from "../GetAppSettings";
import { UpdateAppSettings } from "../UpdateAppSettings";
import { FakeAdminGateway } from "./fakes/FakeAdminGateway";

function coreWith(gateway: FakeAdminGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new AdminModule(gateway));
}

describe("admin handlers (dispatched through the bus)", () => {
  it("routes settings reads through the gateway", async () => {
    const gateway = new FakeAdminGateway();
    const core = coreWith(gateway);

    const settings = await core.execute(new GetAppSettings());

    expect(settings).toEqual({
      registrationEnabled: true,
      chatEnabledForUsers: true,
    });
    expect(gateway.callsTo("getSettings")).toHaveLength(1);
  });

  it("routes settings updates through the gateway", async () => {
    const gateway = new FakeAdminGateway();
    const core = coreWith(gateway);

    const settings = await core.execute(new UpdateAppSettings({ chatEnabledForUsers: false }));

    expect(settings).toEqual({
      registrationEnabled: true,
      chatEnabledForUsers: false,
    });
    expect(gateway.callsTo("updateSettings")[0].args).toEqual([
      { chatEnabledForUsers: false },
    ]);
  });
});
