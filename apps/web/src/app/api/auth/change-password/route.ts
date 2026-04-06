import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  buildBackendUrl,
  createBackendHeaders,
  getSessionCookieOptions,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken =
    request.cookies.get(SESSION_COOKIE_NAME)?.value ??
    cookieStore.get(SESSION_COOKIE_NAME)?.value ??
    null;

  if (!sessionToken) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Missing session" },
      { status: 401 },
    );
  }

  const body = await request.text();
  const response = await fetch(buildBackendUrl("/api/auth/change-password"), {
    method: "POST",
    headers: createBackendHeaders(sessionToken),
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Password change failed" }));

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return NextResponse.json(payload, { status: response.status });
}

