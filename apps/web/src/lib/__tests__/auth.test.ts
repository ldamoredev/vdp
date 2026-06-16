import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  changePassword,
  clearCurrentUser,
  confirmSessionAfterUnauthorized,
  fetchSecurityOverview,
  fetchCurrentUser,
  logout,
  logoutOtherSessions,
  refreshCurrentUser,
  setAuthenticatedUser,
  updateProfile,
} from "../auth";

describe("auth client helpers", () => {
  const fetchMock = vi.fn();

  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  function meResponse(user: {
    id: string;
    email: string;
    displayName: string;
    role: "user";
  }) {
    return {
      ok: true,
      json: async () => ({ user }),
    };
  }

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    clearCurrentUser();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("fetchCurrentUser returns the authenticated user", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: "user-1",
          email: "owner@vdp.local",
          displayName: "Owner",
          role: "user",
        },
      }),
    });

    await expect(fetchCurrentUser()).resolves.toEqual({
      id: "user-1",
      email: "owner@vdp.local",
      displayName: "Owner",
      role: "user",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      cache: "no-store",
      credentials: "same-origin",
    });
  });

  it("fetchCurrentUser throws when the session is not valid", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Missing session" }),
    });

    await expect(fetchCurrentUser()).rejects.toThrow("Not authenticated");
  });

  it("keeps the authenticated user when a domain 401 races with a valid session", async () => {
    const user = {
      id: "user-1",
      email: "owner@vdp.local",
      displayName: "Owner",
      role: "user" as const,
    };
    setAuthenticatedUser(user);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ user }),
    });

    await confirmSessionAfterUnauthorized();

    await expect(refreshCurrentUser()).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the authenticated user when session confirmation also fails", async () => {
    setAuthenticatedUser({
      id: "user-1",
      email: "owner@vdp.local",
      displayName: "Owner",
      role: "user",
    });
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Missing session" }),
    });

    await confirmSessionAfterUnauthorized();

    await expect(refreshCurrentUser()).rejects.toThrow("Not authenticated");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not keep a stale confirmation when a newer login supersedes it", async () => {
    const userA = {
      id: "user-1",
      email: "owner@vdp.local",
      displayName: "Owner",
      role: "user" as const,
    };
    const userB = {
      id: "user-2",
      email: "next@vdp.local",
      displayName: "Next",
      role: "user" as const,
    };
    const firstConfirmation = deferred<ReturnType<typeof meResponse>>();
    const secondConfirmation = deferred<ReturnType<typeof meResponse>>();
    fetchMock
      .mockReturnValueOnce(firstConfirmation.promise)
      .mockReturnValueOnce(secondConfirmation.promise);

    setAuthenticatedUser(userA);
    const staleCheck = confirmSessionAfterUnauthorized();
    setAuthenticatedUser(userB);
    firstConfirmation.resolve(meResponse(userA));
    await staleCheck;

    const currentCheck = confirmSessionAfterUnauthorized();
    secondConfirmation.resolve(meResponse(userB));
    await currentCheck;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(refreshCurrentUser()).resolves.toEqual(userB);
  });

  it("updateProfile sends the payload and returns the updated user", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: "user-1",
          email: "owner@vdp.local",
          displayName: "Renamed Owner",
          role: "user",
        },
      }),
    });

    await expect(updateProfile({ displayName: "Renamed Owner" })).resolves.toEqual({
      id: "user-1",
      email: "owner@vdp.local",
      displayName: "Renamed Owner",
      role: "user",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/profile", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Renamed Owner" }),
    });
  });

  it("updateProfile surfaces backend messages on failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Display name invalid" }),
    });

    await expect(updateProfile({ displayName: "" })).rejects.toThrow(
      "Display name invalid",
    );
  });

  it("changePassword posts credentials to the auth endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await expect(
      changePassword({
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/change-password", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
    });
  });

  it("changePassword throws a friendly backend message when it fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid credentials" }),
    });

    await expect(
      changePassword({
        currentPassword: "wrong-password",
        newPassword: "new-password",
      }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("logout calls the logout endpoint with same-origin credentials", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await logout();

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  });

  it("fetchSecurityOverview returns active sessions and recent events", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessions: [
          {
            id: "session-1",
            userAgent: "Mozilla/5.0",
            ipAddress: "127.0.0.1",
            lastSeenAt: "2026-04-05T12:00:00.000Z",
            createdAt: "2026-04-05T10:00:00.000Z",
            expiresAt: "2026-05-05T10:00:00.000Z",
            isCurrent: true,
          },
        ],
        events: [
          {
            id: "event-1",
            action: "auth.login",
            resourceType: "session",
            resourceId: "session-1",
            actorSessionId: "session-1",
            createdAt: "2026-04-05T12:00:00.000Z",
            metadata: null,
          },
        ],
      }),
    });

    await expect(fetchSecurityOverview()).resolves.toEqual({
      sessions: [
        {
          id: "session-1",
          userAgent: "Mozilla/5.0",
          ipAddress: "127.0.0.1",
          lastSeenAt: "2026-04-05T12:00:00.000Z",
          createdAt: "2026-04-05T10:00:00.000Z",
          expiresAt: "2026-05-05T10:00:00.000Z",
          isCurrent: true,
        },
      ],
      events: [
        {
          id: "event-1",
          action: "auth.login",
          resourceType: "session",
          resourceId: "session-1",
          actorSessionId: "session-1",
          createdAt: "2026-04-05T12:00:00.000Z",
          metadata: null,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/security", {
      cache: "no-store",
      credentials: "same-origin",
    });
  });

  it("logoutOtherSessions posts to the auth endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ revokedSessions: 2 }),
    });

    await expect(logoutOtherSessions()).resolves.toEqual({ revokedSessions: 2 });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout-others", {
      method: "POST",
      credentials: "same-origin",
    });
  });
});
