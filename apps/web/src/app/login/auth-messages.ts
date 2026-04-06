export type AuthErrorPayload = {
  error?: string;
  message?: string;
};

export function getFriendlyAuthError(
  payload: AuthErrorPayload | null,
  mode: "loading" | "login" | "register",
): string {
  if (!payload) {
    return mode === "register"
      ? "No pudimos crear tu usuario. Intenta de nuevo."
      : "No pudimos iniciar sesion. Intenta de nuevo.";
  }

  if (payload.error === "CONFLICT") {
    return "Ese email ya esta registrado.";
  }

  if (payload.error === "UNAUTHORIZED") {
    return "Email o contrasena incorrectos.";
  }

  if (payload.error === "VALIDATION_ERROR") {
    return payload.message || "Revisa los datos ingresados.";
  }

  if (payload.message === "Email already registered") {
    return "Ese email ya esta registrado.";
  }

  if (payload.message === "Invalid credentials") {
    return "Email o contrasena incorrectos.";
  }

  return mode === "register"
    ? "No pudimos crear tu usuario. Intenta de nuevo."
    : "No pudimos iniciar sesion. Intenta de nuevo.";
}

export function getLoginNotice(message?: string | null): string {
  if (message === "password-changed") {
    return "Contrasena actualizada. Inicia sesion otra vez con tu nueva clave.";
  }

  return "";
}

