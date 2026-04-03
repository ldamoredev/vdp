"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { CurrentUser } from "@/lib/auth";

type AuthErrorPayload = {
  error?: string;
  message?: string;
};

type AuthSuccessPayload = {
  user: CurrentUser;
};

async function waitForSessionConfirmation(): Promise<boolean> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => null);

    if (response?.ok) {
      return true;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 80 * (attempt + 1));
    });
  }

  return false;
}

function getFriendlyAuthError(
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

export function LoginPageClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"loading" | "login" | "register">("loading");
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSetup() {
      try {
        const response = await fetch("/api/auth/setup", { cache: "no-store" });
        const payload = (await response.json()) as { hasUsers?: boolean };

        if (!cancelled) {
          const nextHasUsers = Boolean(payload.hasUsers);
          setHasUsers(nextHasUsers);
          setMode(nextHasUsers ? "login" : "register");
        }
      } catch {
        if (!cancelled) {
          setError("No pudimos preparar el acceso. Puedes intentar iniciar sesion.");
          setHasUsers(true);
          setMode("login");
        }
      }
    }

    void loadSetup();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { displayName, email, password }
            : { email, password },
        ),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as AuthErrorPayload | null;
        setError(getFriendlyAuthError(payload, mode));
        setLoading(false);
        return;
      }

      const payload = (await res.json()) as AuthSuccessPayload;
      queryClient.setQueryData(["auth", "me"], payload.user);

      const sessionReady = await waitForSessionConfirmation();
      if (!sessionReady) {
        queryClient.removeQueries({ queryKey: ["auth", "me"], exact: true });
        setError("La sesion no quedo lista a tiempo. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  }

  const isRegisterMode = mode === "register";
  const isLoadingMode = mode === "loading";
  const title = isLoadingMode
    ? "Preparando acceso"
    : isRegisterMode
      ? "Crea tu cuenta"
      : "Bienvenido de nuevo";
  const description = isLoadingMode
    ? "Estamos revisando el estado de acceso de la app."
    : isRegisterMode
      ? hasUsers
        ? "Abre tu espacio personal con email, nombre visible y una contrasena segura."
        : "Crea la primera cuenta para empezar a usar VDP."
      : "Ingresa con el email y la contrasena de tu cuenta.";

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 28%), radial-gradient(circle at 80% 18%, color-mix(in srgb, var(--accent-green) 14%, transparent), transparent 24%), radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 30%)",
        }}
      />
      <div className="relative flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-5 rounded-[28px] p-8 shadow-2xl"
        style={{
          background: "var(--glass)",
          border: "1px solid var(--glass-border)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex justify-center">
          <div
            className="rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]"
            style={{
              color: "var(--foreground-muted)",
              background: "var(--hover-overlay)",
              border: "1px solid var(--glass-border)",
            }}
          >
            Acceso seguro
          </div>
        </div>

        <div className="text-center">
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            VDP
          </h1>
          <p
            className="mt-4 text-xl font-medium"
            style={{ color: "var(--foreground)" }}
          >
            {title}
          </p>
          <p
            className="text-sm mt-2 leading-6"
            style={{ color: "var(--foreground-muted)" }}
          >
            {description}
          </p>
        </div>

        {!isLoadingMode && (
          <div
            className="grid grid-cols-2 gap-2 rounded-2xl p-1"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("login");
              }}
              className="rounded-xl px-3 py-2 text-sm font-medium transition-all"
              style={{
                background: mode === "login" ? "var(--accent)" : "transparent",
                color: mode === "login" ? "#fff" : "var(--foreground-muted)",
              }}
            >
              Iniciar sesion
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("register");
              }}
              className="rounded-xl px-3 py-2 text-sm font-medium transition-all"
              style={{
                background: mode === "register" ? "var(--accent)" : "transparent",
                color: mode === "register" ? "#fff" : "var(--foreground-muted)",
              }}
            >
              Crear cuenta
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {isRegisterMode && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Nombre visible
              </span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como quieres que te veamos"
                autoFocus
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--foreground)",
                }}
              />
            </label>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoFocus={!isRegisterMode}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
              }}
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Contrasena
              </span>
              {isRegisterMode && (
                <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>
                  Minimo 8 caracteres
                </span>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegisterMode ? "Crea una contrasena segura" : "Tu contrasena"}
              required
              minLength={8}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
              }}
            />
          </label>
        </div>

        {isRegisterMode && (
          <div
            className="rounded-2xl px-4 py-3 text-sm leading-6"
            style={{
              background: "var(--hover-overlay)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground-muted)",
            }}
          >
            Al crear tu cuenta entraras directamente a tu espacio personal de tareas, wallet y chat.
          </div>
        )}

        {error && (
          <p
            className="text-sm text-center"
            style={{ color: "var(--accent-red)" }}
            aria-live="polite"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            isLoadingMode ||
            !email ||
            !password ||
            (isRegisterMode && !displayName)
          }
          className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          {loading ? (isRegisterMode ? "Creando cuenta..." : "Entrando...") : title}
        </button>

        {!isLoadingMode && (
          <p className="text-center text-xs leading-5" style={{ color: "var(--foreground-muted)" }}>
            {isRegisterMode
              ? "Tu sesion se iniciara automaticamente despues de crear la cuenta."
              : "Si todavia no tienes cuenta, puedes crearla desde esta misma pantalla."}
          </p>
        )}
      </form>
      </div>
    </div>
  );
}
