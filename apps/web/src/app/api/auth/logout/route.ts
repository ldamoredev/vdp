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

  if (sessionToken) {
    await fetch(buildBackendUrl("/api/auth/logout"), {
      method: "POST",
      headers: createBackendHeaders(sessionToken),
      cache: "no-store",
    }).catch(() => undefined);
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
