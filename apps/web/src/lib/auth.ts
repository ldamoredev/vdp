import { useCallback, useEffect, useState } from "react";

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

type CurrentUserSnapshot = {
  data: CurrentUser | undefined;
  error: Error | null;
  isLoading: boolean;
  loadedAt: number;
};

const CURRENT_USER_STALE_MS = 30_000;
const currentUserSubscribers = new Set<() => void>();
let currentUserSnapshot: CurrentUserSnapshot = {
  data: undefined,
  error: null,
  isLoading: false,
  loadedAt: 0,
};
let currentUserRequest: Promise<CurrentUser> | null = null;
let unauthorizedSessionCheck: Promise<void> | null = null;
let currentUserVersion = 0;

function notifyCurrentUserSubscribers(): void {
  currentUserSubscribers.forEach((subscriber) => subscriber());
}

function setCurrentUserSnapshot(update: Partial<CurrentUserSnapshot>): void {
  currentUserSnapshot = { ...currentUserSnapshot, ...update };
  notifyCurrentUserSubscribers();
}

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
  clearCurrentUser();
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
    message: "No se pudo cambiar la contraseña",
  }))) as { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? "No se pudo cambiar la contraseña");
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

export function setAuthenticatedUser(user: CurrentUser): void {
  currentUserVersion += 1;
  setCurrentUserSnapshot({
    data: user,
    error: null,
    isLoading: false,
    loadedAt: Date.now(),
  });
}

export function clearCurrentUser(): void {
  currentUserVersion += 1;
  currentUserRequest = null;
  unauthorizedSessionCheck = null;
  setCurrentUserSnapshot({
    data: undefined,
    error: new Error("Not authenticated"),
    isLoading: false,
    loadedAt: 0,
  });
}

export function confirmSessionAfterUnauthorized(): Promise<void> {
  if (unauthorizedSessionCheck) return unauthorizedSessionCheck;

  const requestVersion = currentUserVersion + 1;
  currentUserVersion = requestVersion;
  setCurrentUserSnapshot({ isLoading: true, error: null });

  const request = fetchCurrentUser()
    .then((user) => {
      if (requestVersion === currentUserVersion) {
        setCurrentUserSnapshot({
          data: user,
          error: null,
          isLoading: false,
          loadedAt: Date.now(),
        });
      }
    })
    .catch(() => {
      if (requestVersion === currentUserVersion) {
        clearCurrentUser();
      }
    })
    .finally(() => {
      if (unauthorizedSessionCheck === request) {
        unauthorizedSessionCheck = null;
      }
    });

  unauthorizedSessionCheck = request;
  return request;
}

export async function refreshCurrentUser(force = false): Promise<CurrentUser> {
  const cachedUser = currentUserSnapshot.data;
  const fresh =
    cachedUser &&
    !currentUserSnapshot.error &&
    Date.now() - currentUserSnapshot.loadedAt < CURRENT_USER_STALE_MS;

  if (!force && fresh) {
    return cachedUser;
  }

  if (currentUserRequest) {
    return currentUserRequest;
  }

  const requestVersion = currentUserVersion + 1;
  currentUserVersion = requestVersion;
  setCurrentUserSnapshot({ isLoading: true, error: null });
  const request = fetchCurrentUser()
    .then((user) => {
      if (requestVersion === currentUserVersion) {
        setCurrentUserSnapshot({
          data: user,
          error: null,
          isLoading: false,
          loadedAt: Date.now(),
        });
      }
      return user;
    })
    .catch((error: unknown) => {
      const nextError = error instanceof Error ? error : new Error("Not authenticated");
      if (requestVersion === currentUserVersion) {
        setCurrentUserSnapshot({
          data: undefined,
          error: nextError,
          isLoading: false,
          loadedAt: 0,
        });
      }
      throw nextError;
    })
    .finally(() => {
      if (currentUserRequest === request) {
        currentUserRequest = null;
      }
    });

  currentUserRequest = request;
  return currentUserRequest;
}

export function useCurrentUser() {
  const [snapshot, setSnapshot] = useState(currentUserSnapshot);

  useEffect(() => {
    const subscriber = () => setSnapshot(currentUserSnapshot);
    currentUserSubscribers.add(subscriber);
    void refreshCurrentUser().catch(() => {});

    return () => {
      currentUserSubscribers.delete(subscriber);
    };
  }, []);

  const refetch = useCallback(() => refreshCurrentUser(true), []);

  return {
    data: snapshot.data,
    error: snapshot.error,
    isLoading: snapshot.isLoading,
    isError: snapshot.error !== null,
    refetch,
  };
}

export function useSecurityOverview() {
  const [data, setData] = useState<SecurityOverviewResponse | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchSecurityOverview();
      setData(overview);
      return overview;
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error("No se pudo cargar la seguridad");
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSecurityOverview()
      .then((overview) => {
        if (!cancelled) setData(overview);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught : new Error("No se pudo cargar la seguridad"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch,
  };
}
