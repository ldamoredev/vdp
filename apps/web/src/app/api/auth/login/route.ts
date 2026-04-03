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
  const body = await request.text();
  const response = await fetch(buildBackendUrl("/api/auth/login"), {
    method: "POST",
    headers: createBackendHeaders(),
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Login failed" }));

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status });
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    payload.sessionToken,
    getSessionCookieOptions(),
  );

  return NextResponse.json({ user: payload.user });
}
