import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/server/backend";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { POST as loginPOST } from "../login/route";
import { POST as logoutPOST } from "../logout/route";
import { GET as meGET } from "../me/route";

function createRequest({
  body = "",
  sessionToken = null,
}: {
  body?: string;
  sessionToken?: string | null;
} = {}): NextRequest {
  return {
    text: vi.fn(async () => body),
    cookies: {
      get: vi.fn((name: string) => {
        if (name !== SESSION_COOKIE_NAME || !sessionToken) return undefined;
        return { value: sessionToken };
      }),
    },
  } as unknown as NextRequest;
}

describe("auth route handlers", () => {
  const cookieStore = {
    get: vi.fn(),
    set: vi.fn(),
  };

  beforeEach(() => {
    cookiesMock.mockResolvedValue(cookieStore);
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("login stores the managed session cookie with shared options", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: "user-1",
          email: "owner@vdp.local",
          displayName: "Owner",
          role: "user",
        },
        sessionToken: "session-token-1",
      }),
    } as Response);

    const response = await loginPOST(
      createRequest({
        body: JSON.stringify({ email: "owner@vdp.local", password: "secret" }),
      }),
    );

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "session-token-1",
      getSessionCookieOptions(),
    );
    expect(await response.json()).toEqual({
      user: {
        id: "user-1",
        email: "owner@vdp.local",
        displayName: "Owner",
        role: "user",
      },
    });
  });

  it("/me clears the cookie when the backend rejects the session", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Session expired" }),
    } as Response);

    const response = await meGET(createRequest({ sessionToken: "session-token-1" }));

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({
        ...getSessionCookieOptions(),
        maxAge: 0,
      }),
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Session expired" });
  });

  it("logout clears the cookie even if the backend call fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new Error("backend unavailable"));

    const response = await logoutPOST(createRequest({ sessionToken: "session-token-1" }));

    expect(cookieStore.set).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      "",
      expect.objectContaining({
        ...getSessionCookieOptions(),
        maxAge: 0,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
