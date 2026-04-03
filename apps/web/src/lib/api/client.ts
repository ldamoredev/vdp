const API_BASE = "/api/proxy/v1";

export type QueryParams = Record<string, string | number | boolean | undefined>;

type ApiErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  code?: string;
  status: number;
  details?: unknown;

  constructor(message: string, options: { code?: string; status: number; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

function toHeaderRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function buildHeaders(
  extra?: HeadersInit,
  defaultContentType?: string,
): Record<string, string> {
  const headers = toHeaderRecord(extra);

  if (defaultContentType && !("Content-Type" in headers)) {
    headers["Content-Type"] = defaultContentType;
  }

  return headers;
}

export function withQueryParams(path: string, params?: QueryParams): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = buildHeaders(
    options?.headers,
    options?.body ? "application/json" : undefined,
  );

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: "same-origin",
    ...options,
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch((): ApiErrorPayload => ({ message: res.statusText }));
    throw new ApiError(error.message || "Request failed", {
      code: error.error,
      status: res.status,
      details: error.details,
    });
  }
  return res.json();
}

export async function* chatStream(endpoint: string, message: string, conversationId?: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: buildHeaders(undefined, "application/json"),
    credentials: "same-origin",
    body: JSON.stringify({ message, conversationId }),
  });
  if (!res.ok) {
    const error = await res
      .json()
      .catch((): ApiErrorPayload => ({ message: res.statusText }));
    throw new ApiError(error.message || "Chat request failed", {
      code: error.error,
      status: res.status,
      details: error.details,
    });
  }
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          yield JSON.parse(data);
        } catch {}
      }
    }
  }
}
