const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

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

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (options?.body) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
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
    headers: { "Content-Type": "application/json" },
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
