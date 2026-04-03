import { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  buildBackendUrl,
  createForwardHeaders,
  filterResponseHeaders,
} from "@/lib/server/backend";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const joinedPath = path.join("/");
  const url = new URL(request.url);
  const targetUrl = buildBackendUrl(`/api/v1/${joinedPath}${url.search}`);
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  const method = request.method.toUpperCase();

  const init: RequestInit = {
    method,
    headers: createForwardHeaders(request, sessionToken),
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(targetUrl, init);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: filterResponseHeaders(response.headers),
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
