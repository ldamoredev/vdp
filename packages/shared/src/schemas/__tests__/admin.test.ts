import { describe, expect, it } from "vitest";

import { updateAppSettingsSchema } from "../admin";

describe("updateAppSettingsSchema", () => {
  it("requires at least one setting", () => {
    expect(() => updateAppSettingsSchema.parse({})).toThrow();
  });

  it("accepts partial settings patches", () => {
    expect(updateAppSettingsSchema.parse({ chatEnabledForUsers: false })).toEqual({
      chatEnabledForUsers: false,
    });
  });
});
