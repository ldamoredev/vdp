"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { CurrentUser } from "@/lib/auth";
import { AuthErrorPayload, getFriendlyAuthError } from "./auth-messages";

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

export function LoginPageClient({
  nextPath,
  notice = "",
}: {
  nextPath: string;
  notice?: string;
}) {
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
      {/* Background mesh */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 20%, color-mix(in srgb, var(--accent) 14%, transparent), transparent), radial-gradient(ellipse 50% 50% at 75% 15%, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent), radial-gradient(ellipse 40% 35% at 50% 90%, color-mix(in srgb, var(--accent) 8%, transparent), transparent)",
        }}
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        {/* Brand mark */}
        <div className="absolute top-6 left-6 flex items-center gap-2.5 animate-fade-in">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] text-white text-sm font-bold shadow-md">
            V
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--foreground)]">VDP</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm flex flex-col gap-5 rounded-2xl p-8 animate-fade-in-up"
          style={{
            background: "var(--glass)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] mb-5 text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)]">
              <div className="w-1 h-1 rounded-full bg-[var(--accent-green)]" />
              Acceso seguro
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-1">
              {title}
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
              {description}
            </p>
          </div>

          {/* Mode toggle */}
          {!isLoadingMode && (
            <div
              className="grid grid-cols-2 gap-1 rounded-xl p-1"
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
                className="rounded-lg px-3 py-2 text-sm font-medium transition-all"
                style={{
                  background: mode === "login" ? "var(--accent)" : "transparent",
                  color: mode === "login" ? "#fff" : "var(--foreground-muted)",
                  boxShadow: mode === "login" ? "0 2px 8px var(--accent-glow)" : "none",
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
                className="rounded-lg px-3 py-2 text-sm font-medium transition-all"
                style={{
                  background: mode === "register" ? "var(--accent)" : "transparent",
                  color: mode === "register" ? "#fff" : "var(--foreground-muted)",
                  boxShadow: mode === "register" ? "0 2px 8px var(--accent-glow)" : "none",
                }}
              >
                Crear cuenta
              </button>
            </div>
          )}

          {/* Form fields */}
          <div className="flex flex-col gap-4">
            {isRegisterMode && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Nombre visible
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Como quieres que te veamos"
                  autoFocus
                  required
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--foreground)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus={!isRegisterMode}
                required
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Contrasena
                </span>
                {isRegisterMode && (
                  <span className="text-[11px] text-[var(--muted)]">
                    Min. 8 caracteres
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
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </label>
          </div>

          {isRegisterMode && (
            <div className="rounded-xl px-4 py-3 text-[13px] leading-relaxed text-[var(--foreground-muted)] bg-[var(--hover-overlay)] border border-[var(--glass-border)]">
              Al crear tu cuenta entraras directamente a tu espacio personal de tareas, wallet y chat.
            </div>
          )}

          {error && (
            <p
              className="text-sm text-center font-medium"
              style={{ color: "var(--accent-red)" }}
              aria-live="polite"
            >
              {error}
            </p>
          )}

          {!error && notice && (
            <div
              className="rounded-xl border border-[var(--green-soft-border)] bg-[var(--green-soft-bg)] px-4 py-3 text-center text-sm font-medium text-[var(--green-soft-text)]"
              aria-live="polite"
            >
              {notice}
            </div>
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
            className="btn-primary w-full justify-center py-3 text-sm"
          >
            {loading ? (isRegisterMode ? "Creando cuenta..." : "Entrando...") : title}
          </button>

          {!isLoadingMode && (
            <p className="text-center text-xs text-[var(--muted)] leading-relaxed">
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
