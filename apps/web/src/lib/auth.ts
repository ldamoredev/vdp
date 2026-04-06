"use client";

import { useQuery } from "@tanstack/react-query";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: "user";
};

type MeResponse = {
  user: CurrentUser;
};

type UpdateProfilePayload = {
  displayName: string;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type SecuritySession = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastSeenAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

export type SecurityEvent = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  actorSessionId: string | null;
  createdAt: string;
  metadata: unknown;
};

type SecurityOverviewResponse = {
  sessions: SecuritySession[];
  events: SecurityEvent[];
};

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch("/api/auth/me", {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Not authenticated");
  }

  const payload = (await response.json()) as MeResponse;
  return payload.user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<CurrentUser> {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({
    message: "No se pudo actualizar el perfil",
  }))) as { user?: CurrentUser; message?: string };

  if (!response.ok || !data.user) {
    throw new Error(data.message ?? "No se pudo actualizar el perfil");
  }

  return data.user;
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  const response = await fetch("/api/auth/change-password", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({
    message: "No se pudo cambiar la contrasena",
  }))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "No se pudo cambiar la contrasena");
  }
}

export async function fetchSecurityOverview(): Promise<SecurityOverviewResponse> {
  const response = await fetch("/api/auth/security", {
    cache: "no-store",
    credentials: "same-origin",
  });

  const data = (await response.json().catch(() => ({
    message: "No se pudo cargar la seguridad de la cuenta",
  }))) as SecurityOverviewResponse & { message?: string };

  if (!response.ok || !Array.isArray(data.sessions) || !Array.isArray(data.events)) {
    throw new Error(data.message ?? "No se pudo cargar la seguridad de la cuenta");
  }

  return {
    sessions: data.sessions,
    events: data.events,
  };
}

export async function logoutOtherSessions(): Promise<{ revokedSessions: number }> {
  const response = await fetch("/api/auth/logout-others", {
    method: "POST",
    credentials: "same-origin",
  });

  const data = (await response.json().catch(() => ({
    message: "No se pudieron cerrar las otras sesiones",
  }))) as { revokedSessions?: number; message?: string };

  if (!response.ok || typeof data.revokedSessions !== "number") {
    throw new Error(data.message ?? "No se pudieron cerrar las otras sesiones");
  }

  return { revokedSessions: data.revokedSessions };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 30_000,
  });
}

export function useSecurityOverview() {
  return useQuery({
    queryKey: ["auth", "security"],
    queryFn: fetchSecurityOverview,
    retry: false,
    staleTime: 15_000,
  });
}
