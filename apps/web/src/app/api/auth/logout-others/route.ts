import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  buildBackendUrl,
  createBackendHeaders,
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

  const response = await fetch(buildBackendUrl("/api/auth/logout-others"), {
    method: "POST",
    headers: createBackendHeaders(sessionToken),
    body: await request.text(),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Other sessions logout failed" }));
  return NextResponse.json(payload, { status: response.status });
}
