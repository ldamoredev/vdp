import { describe, expect, it } from "vitest";
import { domains, getDomainConfig, getShellNavState, isSettingsPath } from "../navigation";

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

  it("keeps medical records as a health section, not a domain", () => {
    expect(domains.map((domain) => domain.key)).not.toContain("medical");
    expect(getShellNavState("/health/medical")).toEqual({
      homeActive: false,
      activeDomain: "health",
      settingsActive: false,
    });
    expect(getDomainConfig("medical")).toBeUndefined();
  });

  it("exposes medical records from the health sidebar", () => {
    const health = getDomainConfig("health");
    expect(health?.navItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: "/health/medical", label: "Fichas médicas" }),
      ]),
    );
  });
});
