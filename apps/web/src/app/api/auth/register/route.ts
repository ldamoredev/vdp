import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildBackendUrl,
  createBackendHeaders,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await fetch(buildBackendUrl("/api/auth/register"), {
    method: "POST",
    headers: createBackendHeaders(),
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Registration failed" }));

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
