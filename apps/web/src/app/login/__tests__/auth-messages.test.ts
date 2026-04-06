import { describe, expect, it } from "vitest";
import { getFriendlyAuthError, getLoginNotice } from "../auth-messages";

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

