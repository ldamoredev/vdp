import { NextResponse } from "next/server";
import { buildBackendUrl } from "@/lib/server/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  const response = await fetch(buildBackendUrl("/api/auth/setup"), {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({ message: "Unable to load setup status" }));
  return NextResponse.json(payload, { status: response.status });
}
