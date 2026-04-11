import { describe, expect, it } from "vitest";
import { isPublicPath } from "../middleware";

describe("middleware public paths", () => {
  it("treats PWA manifest and icon routes as public", () => {
    expect(isPublicPath("/manifest.webmanifest")).toBe(true);
    expect(isPublicPath("/apple-icon.png")).toBe(true);
    expect(isPublicPath("/icon-192.png")).toBe(true);
    expect(isPublicPath("/icon-512.png")).toBe(true);
  });

  it("keeps authenticated app screens protected", () => {
    expect(isPublicPath("/home")).toBe(false);
    expect(isPublicPath("/wallet")).toBe(false);
  });
});
