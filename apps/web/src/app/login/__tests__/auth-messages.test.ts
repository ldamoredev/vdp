import { describe, expect, it } from "vitest";
import {
  getFriendlyAuthError,
  getLoginNotice,
  resolvePostLoginPath,
} from "../auth-messages";

describe("getFriendlyAuthError", () => {
  it("maps conflict errors to the registered-email copy", () => {
    expect(
      getFriendlyAuthError({ error: "CONFLICT" }, "register"),
    ).toBe("Ese email ya esta registrado.");
  });

  it("maps unauthorized errors to invalid-credentials copy", () => {
    expect(
      getFriendlyAuthError({ error: "UNAUTHORIZED" }, "login"),
    ).toBe("Email o contrasena incorrectos.");
  });

  it("preserves validation messages when present", () => {
    expect(
      getFriendlyAuthError(
        { error: "VALIDATION_ERROR", message: "Revisa el email" },
        "login",
      ),
    ).toBe("Revisa el email");
  });

  it("falls back to mode-specific generic messages", () => {
    expect(getFriendlyAuthError(null, "register")).toBe(
      "No pudimos crear tu usuario. Intenta de nuevo.",
    );
    expect(getFriendlyAuthError(null, "login")).toBe(
      "No pudimos iniciar sesion. Intenta de nuevo.",
    );
  });
});

describe("getLoginNotice", () => {
  it("returns the password-change success notice", () => {
    expect(getLoginNotice("password-changed")).toBe(
      "Contrasena actualizada. Inicia sesion otra vez con tu nueva clave.",
    );
  });

  it("returns an empty string for unknown messages", () => {
    expect(getLoginNotice("anything-else")).toBe("");
    expect(getLoginNotice()).toBe("");
  });
});

describe("resolvePostLoginPath", () => {
  it("keeps valid in-app destinations", () => {
    expect(resolvePostLoginPath("/home")).toBe("/home");
    expect(resolvePostLoginPath("/review?date=2026-04-11")).toBe(
      "/review?date=2026-04-11",
    );
  });

  it("falls back to home for manifest, icons, and internal assets", () => {
    expect(resolvePostLoginPath("/manifest.webmanifest")).toBe("/home");
    expect(resolvePostLoginPath("/apple-icon.png")).toBe("/home");
    expect(resolvePostLoginPath("/_next/static/chunk.js")).toBe("/home");
  });

  it("falls back to home for unsafe or unsupported destinations", () => {
    expect(resolvePostLoginPath("https://evil.test")).toBe("/home");
    expect(resolvePostLoginPath("//evil.test")).toBe("/home");
    expect(resolvePostLoginPath("/api/auth/me")).toBe("/home");
    expect(resolvePostLoginPath(undefined)).toBe("/home");
  });
});
