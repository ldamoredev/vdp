import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const accessSecret = process.env.ACCESS_SECRET;

  if (!accessSecret) {
    return NextResponse.json({ ok: true });
  }

  const body = await request.json().catch(() => null);
  const secret = body?.secret;

  if (typeof secret !== "string" || secret !== accessSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set("access_secret", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
