import { describe, expect, it } from "vitest";
import { getShellNavState, isSettingsPath } from "../navigation";

describe("shell navigation state", () => {
  it("marks settings routes as active utility navigation", () => {
    expect(isSettingsPath("/settings")).toBe(true);
    expect(isSettingsPath("/settings/security")).toBe(true);
    expect(isSettingsPath("/wallet/settings")).toBe(false);

    expect(getShellNavState("/settings")).toEqual({
      homeActive: false,
      activeDomain: null,
      settingsActive: true,
    });
  });

  it("keeps domain and home paths distinct from settings", () => {
    expect(getShellNavState("/home")).toEqual({
      homeActive: true,
      activeDomain: null,
      settingsActive: false,
    });

    expect(getShellNavState("/wallet/transactions")).toEqual({
      homeActive: false,
      activeDomain: "wallet",
      settingsActive: false,
    });
  });
});
