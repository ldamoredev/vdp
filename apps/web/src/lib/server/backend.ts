import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "vdp_session";

const BLOCKED_REQUEST_HEADERS = new Set([
  "connection",
  "content-length",
  "cookie",
  "host",
]);

const BLOCKED_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "set-cookie",
  "transfer-encoding",
]);

function getConfiguredApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
}

export function getBackendOrigin(): string {
  return getConfiguredApiBase().replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendOrigin()}${normalizedPath}`;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function clearSessionCookie(
  cookieStore: Pick<
    {
      set: (
        name: string,
        value: string,
        options: ReturnType<typeof getSessionCookieOptions>,
      ) => void;
    },
    "set"
  >,
) {
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}

export function createForwardHeaders(
  request: NextRequest,
  sessionToken?: string | null,
): Headers {
  const headers = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (BLOCKED_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    headers.set(key, value);
  }

  if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  return headers;
}

export function createBackendHeaders(sessionToken?: string | null): Headers {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  return headers;
}

export function filterResponseHeaders(headers: Headers): Headers {
  const filtered = new Headers();

  for (const [key, value] of headers.entries()) {
    if (BLOCKED_RESPONSE_HEADERS.has(key.toLowerCase())) continue;
    filtered.set(key, value);
  }

  return filtered;
}
