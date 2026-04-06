"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Globe,
  KeyRound,
  LaptopMinimal,
  LoaderCircle,
  LogOut,
  Mail,
  Radar,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRoundCog,
} from "lucide-react";
import {
  changePassword,
  logout,
  logoutOtherSessions,
  type SecurityEvent,
  type SecuritySession,
  useSecurityOverview,
  updateProfile,
  useCurrentUser,
} from "@/lib/auth";
import { ModulePage } from "@/components/primitives/module-page";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityTone, setSecurityTone] = useState<"success" | "warning" | "neutral">("neutral");
  const [discardTarget, setDiscardTarget] = useState<"profile" | "password" | null>(null);
  const { data: securityOverview, isLoading: securityLoading } = useSecurityOverview();

  const currentDisplayName = currentUser?.displayName ?? "";
  const normalizedDisplayName = displayName.trim();
  const profileDirty = normalizedDisplayName !== currentDisplayName;
  const passwordDirty = Boolean(currentPassword || newPassword || confirmPassword);
  const hasUnsavedChanges = profileDirty || passwordDirty;
  const avatarInitials = getUserInitials(currentUser?.displayName, currentUser?.email);
  const activeSessions = securityOverview?.sessions ?? [];
  const currentSession = activeSessions.find((session) => session.isCurrent) ?? null;
  const securityEvents = securityOverview?.events ?? [];
  const otherSessionsCount = activeSessions.filter((session) => !session.isCurrent).length;

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser?.displayName]);

  useEffect(() => {
    if (discardTarget === "profile" && !profileDirty) {
      setDiscardTarget(null);
    }
    if (discardTarget === "password" && !passwordDirty) {
      setDiscardTarget(null);
    }
  }, [discardTarget, passwordDirty, profileDirty]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onMutate: () => {
      setProfileMessage(null);
    },
    onSuccess: async () => {
      setProfileMessage("Nombre actualizado. Tu sesion ya refleja el cambio.");
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
    onError: (error) => {
      setProfileMessage(error instanceof Error ? error.message : "No se pudo actualizar el perfil.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onMutate: () => {
      setPasswordMessage(null);
    },
    onSuccess: async () => {
      setPasswordMessage("Contrasena actualizada. Vas a iniciar sesion de nuevo.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await queryClient.invalidateQueries({ queryKey: ["auth"] });
      router.replace("/login?message=password-changed");
      router.refresh();
    },
    onError: (error) => {
      setPasswordMessage(error instanceof Error ? error.message : "No se pudo cambiar la contrasena.");
    },
  });

  const logoutOthersMutation = useMutation({
    mutationFn: logoutOtherSessions,
    onMutate: () => {
      setSecurityMessage(null);
      setSecurityTone("neutral");
    },
    onSuccess: async ({ revokedSessions }) => {
      setSecurityTone(revokedSessions > 0 ? "success" : "neutral");
      setSecurityMessage(
        revokedSessions > 0
          ? `Se cerraron ${revokedSessions} ${revokedSessions === 1 ? "sesion remota" : "sesiones remotas"}.`
          : "No habia otras sesiones activas para cerrar.",
      );
      await queryClient.invalidateQueries({ queryKey: ["auth", "security"] });
    },
    onError: (error) => {
      setSecurityTone("warning");
      setSecurityMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cerrar las otras sesiones.",
      );
    },
  });

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = normalizedDisplayName;
    if (!nextName || !currentUser) return;

    if (nextName === currentUser.displayName) {
      setProfileMessage("No hay cambios para guardar.");
      return;
    }

    await profileMutation.mutateAsync({ displayName: nextName });
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordMessage("La nueva contrasena y la confirmacion no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }

    await passwordMutation.mutateAsync({
      currentPassword,
      newPassword,
    });
  }

  async function handleLogout() {
    if (hasUnsavedChanges && !window.confirm("Tienes cambios sin guardar. Quieres salir igual?")) {
      return;
    }

    await logout();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
    router.replace("/login");
    router.refresh();
  }

  async function handleLogoutOthers() {
    await logoutOthersMutation.mutateAsync();
  }

  function handleDiscardProfile() {
    if (!profileDirty || !currentUser) return;

    if (discardTarget !== "profile") {
      setDiscardTarget("profile");
      return;
    }

    setDisplayName(currentUser.displayName);
    setProfileMessage("Se descartaron los cambios del perfil.");
    setDiscardTarget(null);
  }

  function handleDiscardPassword() {
    if (!passwordDirty) return;

    if (discardTarget !== "password") {
      setDiscardTarget("password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Se descartaron los cambios de seguridad.");
    setDiscardTarget(null);
  }

  return (
    <ModulePage width="6xl" spacing="8">
      <section className="relative overflow-hidden rounded-[28px] border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-6 shadow-[var(--shadow-xl)] md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute -left-20 top-0 h-44 w-44 rounded-full bg-[var(--accent-glow)] blur-3xl" />
          <div className="absolute right-0 top-6 h-36 w-36 rounded-full bg-[rgba(255,255,255,0.06)] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-[rgba(255,255,255,0.04)] blur-2xl" />
        </div>

        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
              <Sparkles size={14} className="text-[var(--accent)]" />
              Account cockpit
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">
                Configuracion de cuenta
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-[var(--foreground-muted)] md:text-base">
                Ajusta tu identidad visible y refuerza la seguridad de tu acceso desde un solo tablero.
              </p>
            </div>
            {hasUnsavedChanges && (
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--amber-soft-text)]">
                <AlertTriangle size={14} strokeWidth={1.8} />
                Cambios sin guardar
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatPill
              label="Sesion"
              value={currentSession ? `${activeSessions.length} activas` : "Cargando"}
              icon={<BadgeCheck size={16} strokeWidth={1.8} />}
            />
            <StatPill
              label="Proteccion"
              value={otherSessionsCount > 0 ? `${otherSessionsCount} remotas` : "Solo actual"}
              icon={<ShieldCheck size={16} strokeWidth={1.8} />}
            />
            <StatPill
              label="Identidad"
              value={currentUser?.displayName ?? "Usuario"}
              icon={<UserRoundCog size={16} strokeWidth={1.8} />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                  Perfil
                </p>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Tu firma dentro del sistema
                </h2>
                <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                  Cambia el nombre que aparece en el header y en los flujos autenticados.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--accent)]">
                <UserRoundCog size={22} strokeWidth={1.8} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 rounded-[24px] border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] text-2xl font-semibold text-white shadow-[0_18px_40px_var(--accent-glow)]">
                  <div className="absolute inset-[6px] rounded-[22px] border border-[rgba(255,255,255,0.24)]" />
                  <span className="relative">{avatarInitials}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {currentUser?.displayName ?? "Usuario"}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Presencia visible en el shell y en las vistas autenticadas.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <IdentityChip
                      icon={<Mail size={13} strokeWidth={1.8} />}
                      label={currentUser?.email ?? "Sin email"}
                    />
                    <IdentityChip
                      icon={<ShieldCheck size={13} strokeWidth={1.8} />}
                      label="Cuenta protegida"
                    />
                  </div>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--foreground-secondary)]">
                  Nombre visible
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--glass-border-hover)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                  placeholder="Tu nombre"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--foreground-secondary)]">
                  Email
                </span>
                <input
                  value={currentUser?.email ?? ""}
                  readOnly
                  className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-sm text-[var(--foreground-muted)] outline-none"
                />
              </label>

              {profileMessage && (
                <InlineMessage
                  tone={profileMutation.isSuccess ? "success" : profileDirty ? "warning" : "neutral"}
                  message={profileMessage}
                />
              )}

              <DirtyStateRow
                isDirty={profileDirty}
                cleanLabel="Perfil sincronizado"
                dirtyLabel="Nombre pendiente de guardar"
              />

              {discardTarget === "profile" && profileDirty && (
                <DiscardNotice
                  message="Si descartas ahora, se pierde el nombre editado y volvera el actual."
                  onConfirm={handleDiscardProfile}
                  onCancel={() => setDiscardTarget(null)}
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={
                    profileMutation.isPending ||
                    !currentUser ||
                    !normalizedDisplayName ||
                    !profileDirty
                  }
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_var(--accent-glow)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {profileMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={handleDiscardProfile}
                  disabled={!profileDirty}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--hover-overlay-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={15} strokeWidth={1.8} />
                  {discardTarget === "profile" ? "Confirmar descarte" : "Descartar"}
                </button>
                <span className="text-xs text-[var(--muted)]">
                  Se aplica inmediatamente en el shell.
                </span>
              </div>
            </form>
          </article>

          <article className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                  Seguridad
                </p>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Renovar acceso
                </h2>
                <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                  Al cambiar la contrasena, el sistema invalida tus sesiones actuales y te pide volver a entrar.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--accent)]">
                <KeyRound size={22} strokeWidth={1.8} />
              </div>
            </div>

            <form className="space-y-5" onSubmit={handlePasswordSubmit}>
              <PasswordField
                label="Contrasena actual"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
              <PasswordField
                label="Nueva contrasena"
                value={newPassword}
                onChange={setNewPassword}
              />
              <PasswordField
                label="Confirmar nueva contrasena"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              {passwordMessage && (
                <InlineMessage
                  tone={passwordMutation.isSuccess ? "success" : "warning"}
                  message={passwordMessage}
                />
              )}

              <DirtyStateRow
                isDirty={passwordDirty}
                cleanLabel="Seguridad al dia"
                dirtyLabel="Credenciales pendientes de confirmar"
              />

              {discardTarget === "password" && passwordDirty && (
                <DiscardNotice
                  message="Esto limpiara los campos de contrasena antes de enviar cambios al servidor."
                  onConfirm={handleDiscardPassword}
                  onCancel={() => setDiscardTarget(null)}
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={
                    passwordMutation.isPending ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] shadow-[var(--shadow-md)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordMutation.isPending ? "Actualizando..." : "Cambiar contrasena"}
                </button>
                <button
                  type="button"
                  onClick={handleDiscardPassword}
                  disabled={!passwordDirty}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--hover-overlay-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={15} strokeWidth={1.8} />
                  {discardTarget === "password" ? "Confirmar descarte" : "Limpiar"}
                </button>
              </div>
            </form>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))] text-lg font-bold text-white shadow-[0_10px_30px_var(--accent-glow)]">
                <div className="absolute inset-[5px] rounded-[18px] border border-[rgba(255,255,255,0.24)]" />
                <span className="relative">{avatarInitials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {currentUser?.displayName ?? "Usuario"}
                </p>
                <p className="truncate text-sm text-[var(--foreground-muted)]">
                  {currentUser?.email ?? "Sin email"}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                  <CheckCircle2 size={12} strokeWidth={2} className="text-[var(--accent)]" />
                  Monograma activo
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <InsightRow
                eyebrow="Estado"
                title="Sesion operativa"
                copy="Tu cuenta esta autenticada y lista para seguir trabajando."
              />
              <InsightRow
                eyebrow="Politica"
                title="Rotacion inmediata"
                copy="Cada cambio de contrasena revoca las sesiones activas para evitar accesos heredados."
              />
              <InsightRow
                eyebrow="Consejo"
                title="Cambia primero el nombre"
                copy="Actualizar el perfil no corta la sesion, asi que puedes ajustar identidad y luego reforzar seguridad."
              />
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                  Sesiones
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  Dispositivos activos
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                  Revisa donde sigue abierta tu cuenta y corta accesos heredados con un solo gesto.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--accent)]">
                <LaptopMinimal size={22} strokeWidth={1.8} />
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                    <Radar size={12} strokeWidth={1.9} className="text-[var(--accent)]" />
                    Sesion actual
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                    {describeSessionDevice(currentSession)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {currentSession
                      ? `Ultima actividad ${formatDateTime(currentSession.lastSeenAt)}`
                      : securityLoading
                        ? "Leyendo el estado actual..."
                        : "No se pudo detectar la sesion actual."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-2 text-right">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                    Expira
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {currentSession ? formatDateTime(currentSession.expiresAt) : "Pendiente"}
                  </div>
                </div>
              </div>

              {currentSession && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <IdentityChip
                    icon={<Globe size={13} strokeWidth={1.8} />}
                    label={currentSession.ipAddress ?? "IP no registrada"}
                  />
                  <IdentityChip
                    icon={<Clock3 size={13} strokeWidth={1.8} />}
                    label={`Creada ${formatDateTime(currentSession.createdAt)}`}
                  />
                </div>
              )}
            </div>

            {securityMessage && (
              <div className="mt-4">
                <InlineMessage tone={securityTone} message={securityMessage} />
              </div>
            )}

            <div className="mt-5 space-y-3">
              {securityLoading ? (
                <LoadingPanel label="Cargando sesiones activas..." />
              ) : activeSessions.length > 0 ? (
                activeSessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))
              ) : (
                <EmptyState
                  title="Sin sesiones visibles"
                  copy="Cuando el backend reporte sesiones activas, apareceran aqui con su ultima actividad."
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLogoutOthers}
                disabled={logoutOthersMutation.isPending || otherSessionsCount === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--background)] shadow-[var(--shadow-md)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {logoutOthersMutation.isPending ? (
                  <LoaderCircle size={15} strokeWidth={1.8} className="animate-spin" />
                ) : (
                  <LogOut size={15} strokeWidth={1.8} />
                )}
                Cerrar otros dispositivos
              </button>
              <span className="text-xs text-[var(--muted)]">
                {otherSessionsCount > 0
                  ? `${otherSessionsCount} acceso${otherSessionsCount === 1 ? "" : "s"} remoto${otherSessionsCount === 1 ? "" : "s"} listo${otherSessionsCount === 1 ? "" : "s"} para cerrar.`
                  : "No hay otras sesiones activas en este momento."}
              </span>
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Bitacora
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              Eventos recientes de seguridad
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Ultimos cambios sensibles asociados a tu cuenta: accesos, cierres de sesion y ajustes credenciales.
            </p>

            <div className="mt-5 space-y-3">
              {securityLoading ? (
                <LoadingPanel label="Cargando actividad reciente..." />
              ) : securityEvents.length > 0 ? (
                securityEvents.map((event) => (
                  <SecurityEventRow key={event.id} event={event} />
                ))
              ) : (
                <EmptyState
                  title="Sin actividad reciente"
                  copy="Todavia no hay eventos recientes para mostrar en la bitacora."
                />
              )}
            </div>
          </article>

          <article className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--card)] p-6 shadow-[var(--shadow-lg)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Accion rapida
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
              Cerrar sesion ahora
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
              Si solo quieres salir del entorno actual, puedes cerrar sesion sin tocar tus credenciales.
            </p>
            <button
              onClick={handleLogout}
              className="mt-5 inline-flex items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:bg-[var(--hover-overlay-strong)]"
            >
              Cerrar sesion
            </button>
          </article>
        </aside>
      </section>
    </ModulePage>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-3 backdrop-blur-xl">
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--hover-overlay-strong)] text-[var(--accent)]">
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function SessionRow({ session }: { session: SecuritySession }) {
  return (
    <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {describeSessionDevice(session)}
            </p>
            {session.isCurrent && (
              <span className="rounded-full border border-[var(--green-soft-border)] bg-[var(--green-soft-bg)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--green-soft-text)]">
                Actual
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {session.ipAddress ?? "IP no registrada"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            Ultima actividad
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {formatDateTime(session.lastSeenAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityEventRow({ event }: { event: SecurityEvent }) {
  return (
    <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-[75%]">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {getSecurityEventTitle(event)}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
            {getSecurityEventCopy(event)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--card)] px-3 py-2 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            Momento
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
            {formatDateTime(event.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-4 py-4 text-sm text-[var(--foreground-muted)]">
      <LoaderCircle size={16} strokeWidth={1.8} className="animate-spin text-[var(--accent)]" />
      {label}
    </div>
  );
}

function EmptyState({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">{copy}</p>
    </div>
  );
}

function DirtyStateRow({
  isDirty,
  cleanLabel,
  dirtyLabel,
}: {
  isDirty: boolean;
  cleanLabel: string;
  dirtyLabel: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${
        isDirty
          ? "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]"
          : "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--foreground-muted)]"
      }`}
    >
      {isDirty ? (
        <AlertTriangle size={14} strokeWidth={1.8} />
      ) : (
        <CheckCircle2 size={14} strokeWidth={1.8} className="text-[var(--accent)]" />
      )}
      {isDirty ? dirtyLabel : cleanLabel}
    </div>
  );
}

function InlineMessage({
  tone,
  message,
}: {
  tone: "success" | "warning" | "neutral";
  message: string;
}) {
  const styles =
    tone === "success"
      ? "border-[var(--green-soft-border)] bg-[var(--green-soft-bg)] text-[var(--green-soft-text)]"
      : tone === "warning"
        ? "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]"
        : "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--foreground-muted)]";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {message}
    </div>
  );
}

function DiscardNotice({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] p-4 text-sm text-[var(--amber-soft-text)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl leading-6">{message}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[var(--foreground)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--background)] transition-all hover:opacity-90"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--amber-soft-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all hover:bg-[rgba(255,255,255,0.08)]"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[var(--foreground-secondary)]">
        {label}
      </span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--glass-border-hover)] focus:ring-2 focus:ring-[var(--accent-glow)]"
        placeholder="••••••••"
      />
    </label>
  );
}

function IdentityChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)]">
      <span className="text-[var(--accent)]">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function InsightRow({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--hover-overlay)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
        {copy}
      </p>
    </div>
  );
}

function getUserInitials(displayName?: string, email?: string) {
  const source = displayName?.trim() || email?.split("@")[0] || "Usuario";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "U";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function describeSessionDevice(session: SecuritySession | null) {
  if (!session?.userAgent) return "Dispositivo sin identificar";

  const userAgent = session.userAgent;
  const platform = /iphone|ipad|ios/i.test(userAgent)
    ? "iPhone o iPad"
    : /android/i.test(userAgent)
      ? "Android"
      : /mac os x|macintosh/i.test(userAgent)
        ? "Mac"
        : /windows/i.test(userAgent)
          ? "Windows"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "Equipo";

  const browser = /edg/i.test(userAgent)
    ? "Edge"
    : /chrome|crios/i.test(userAgent)
      ? "Chrome"
      : /firefox|fxios/i.test(userAgent)
        ? "Firefox"
        : /safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)
          ? "Safari"
          : "Navegador";

  return `${platform} · ${browser}`;
}

function getSecurityEventTitle(event: SecurityEvent) {
  switch (event.action) {
    case "auth.user_registered":
      return "Cuenta creada";
    case "auth.login":
      return "Inicio de sesion";
    case "auth.logout":
      return "Cierre de sesion";
    case "auth.logout_other_sessions":
      return "Cierre de otros dispositivos";
    case "auth.password_changed":
      return "Contrasena actualizada";
    case "auth.profile_updated":
      return "Perfil actualizado";
    default:
      return "Evento de seguridad";
  }
}

function getSecurityEventCopy(event: SecurityEvent) {
  if (event.action === "auth.logout_other_sessions") {
    const metadata = isRecord(event.metadata) ? event.metadata : null;
    const revokedSessions =
      metadata && typeof metadata.revokedSessions === "number"
        ? metadata.revokedSessions
        : null;
    if (typeof revokedSessions === "number") {
      return revokedSessions > 0
        ? `Se revocaron ${revokedSessions} sesiones activas fuera de este dispositivo.`
        : "Se revisaron las sesiones activas y no habia accesos remotos para cerrar.";
    }
  }

  if (event.action === "auth.profile_updated") {
    const metadata = isRecord(event.metadata) ? event.metadata : null;
    if (metadata && typeof metadata.displayName === "string") {
      return `El nombre visible paso a ser ${metadata.displayName}.`;
    }
  }

  switch (event.action) {
    case "auth.user_registered":
      return "La cuenta se habilito y se creo la primera sesion autenticada.";
    case "auth.login":
      return "Se valido la credencial y se abrio una sesion nueva.";
    case "auth.logout":
      return "Se cerro una sesion existente desde el flujo de salida.";
    case "auth.password_changed":
      return "La contrasena se renovo y las sesiones anteriores quedaron invalidadas.";
    default:
      return "Se registro una accion sensible asociada a tu cuenta.";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
