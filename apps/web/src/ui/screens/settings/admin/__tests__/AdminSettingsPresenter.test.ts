import type { AppSettings } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { AdminModule } from "@/core/app/admin/AdminModule";
import { FakeAdminGateway } from "@/core/app/admin/__tests__/fakes/FakeAdminGateway";
import { AdminSettingsPresenter } from "../AdminSettingsPresenter";

function build(settings?: AppSettings) {
  const gateway = new FakeAdminGateway();
  if (settings) gateway.settings = settings;
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new AdminModule(gateway));
  const presenter = new AdminSettingsPresenter(vi.fn(), core);
  presenter.init(undefined);
  return { presenter, gateway };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("AdminSettingsPresenter", () => {
  it("loads settings on start", async () => {
    const { presenter } = build({ registrationEnabled: false, chatEnabledForUsers: true });

    presenter.start();
    await flush();

    expect(presenter.model.isLoading).toBe(false);
    expect(presenter.model.toggles.map((toggle) => [toggle.key, toggle.enabled])).toEqual([
      ["registrationEnabled", false],
      ["chatEnabledForUsers", true],
    ]);
  });

  it("toggles a setting with a per-toggle busy state and reloads", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();
    const nextSettings = { registrationEnabled: true, chatEnabledForUsers: false };
    const pending = deferred<AppSettings>();
    const updateSettings = vi.spyOn(gateway, "updateSettings").mockReturnValueOnce(pending.promise);

    const action = presenter.toggleSetting("chatEnabledForUsers");

    expect(presenter.model.toggles.find((toggle) => toggle.key === "chatEnabledForUsers")?.busy).toBe(true);
    gateway.settings = nextSettings;
    pending.resolve(nextSettings);
    await action;

    expect(updateSettings).toHaveBeenCalledWith({ chatEnabledForUsers: false });
    expect(presenter.model.toggles.find((toggle) => toggle.key === "chatEnabledForUsers")?.enabled).toBe(false);
    expect(presenter.model.toggles.find((toggle) => toggle.key === "chatEnabledForUsers")?.busy).toBe(false);
  });

  it("shows an error when a toggle fails", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();
    vi.spyOn(gateway, "updateSettings").mockRejectedValueOnce(new Error("No autorizado"));

    await presenter.toggleSetting("registrationEnabled");

    expect(presenter.model.error).toBe("No autorizado");
    expect(presenter.model.toggles.find((toggle) => toggle.key === "registrationEnabled")?.busy).toBe(false);
  });
});
