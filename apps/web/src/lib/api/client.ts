const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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

function getAccessSecret(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)access_secret=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const secret = getAccessSecret();
  if (secret) headers["x-api-key"] = secret;
  return headers;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = buildHeaders(
    options?.body ? { "Content-Type": "application/json" } : undefined,
  );

  const res = await fetch(`${API_BASE}${path}`, { headers,
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
    headers: buildHeaders({ "Content-Type": "application/json" }),
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
