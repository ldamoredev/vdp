import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  buildBackendUrl,
  clearSessionCookie,
  createBackendHeaders,
  SESSION_COOKIE_NAME,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

  const response = await fetch(buildBackendUrl("/api/auth/me"), {
    headers: createBackendHeaders(sessionToken),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Unable to load session" }));

  if (!response.ok) {
    clearSessionCookie(cookieStore);
    return NextResponse.json(payload, { status: response.status });
  }

  return NextResponse.json(payload, { status: response.status });
}
