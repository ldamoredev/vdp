import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  buildBackendUrl,
  createBackendHeaders,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
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
  const response = await fetch(buildBackendUrl("/api/auth/profile"), {
    method: "PATCH",
    headers: createBackendHeaders(sessionToken),
    body,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Profile update failed" }));
  return NextResponse.json(payload, { status: response.status });
}

