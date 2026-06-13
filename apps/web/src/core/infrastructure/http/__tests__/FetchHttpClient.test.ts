import { HttpError, HttpInterceptor, HttpRequest, NetworkError } from "@nbottarini/abstract-http-client";
import { describe, expect, it, vi } from "vitest";

import { FetchHttpClient } from "../FetchHttpClient";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("FetchHttpClient", () => {
  it("prefixes the base url and forwards same-origin credentials by default", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new FetchHttpClient({ baseUrl: "/api/v1", fetchFn });

    await client.get("/health/habits");

    expect(fetchFn).toHaveBeenCalledWith(
      "/api/v1/health/habits",
      expect.objectContaining({ method: "GET", credentials: "same-origin" }),
    );
  });

  it("parses a JSON body into the typed response", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ habits: [{ id: "h1" }] }));
    const client = new FetchHttpClient({ baseUrl: "/api/v1", fetchFn });

    const response = await client.get<{ habits: { id: string }[] }>("/health/habits");

    expect(response.status).toBe(200);
    expect(response.body.habits[0].id).toBe("h1");
  });

  it("serializes a plain-object body as JSON and sets Content-Type", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: "g1" }, { status: 201 }));
    const client = new FetchHttpClient({ baseUrl: "/api/v1", fetchFn });

    await client.post("/health/goals", { title: "Gym", targetDate: "2026-07-01" });

    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ title: "Gym", targetDate: "2026-07-01" }));
  });

  it("does not override an explicit Content-Type", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}));
    const client = new FetchHttpClient({ baseUrl: "/api/v1", fetchFn });

    await client.post("/x", "raw", { "content-type": "text/plain" });

    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect(init.headers).toMatchObject({ "content-type": "text/plain" });
  });

  it("treats a 204 as an empty body", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = new FetchHttpClient({ fetchFn });

    const response = await client.delete("/x");

    expect(response.status).toBe(204);
    expect(response.body).toBeUndefined();
  });

  it("throws HttpError carrying the parsed body on a non-2xx response", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: "NOT_FOUND", message: "nope" }, { status: 404 }));
    const client = new FetchHttpClient({ baseUrl: "/api/v1", fetchFn });

    const error = await client.get("/missing").catch((e) => e);

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.body).toMatchObject({ error: "NOT_FOUND", message: "nope" });
  });

  it("wraps a fetch rejection in a NetworkError", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const client = new FetchHttpClient({ fetchFn });

    const error = await client.get("/x").catch((e) => e);

    expect(error).toBeInstanceOf(NetworkError);
    expect(error.innerError).toBeInstanceOf(TypeError);
  });

  it("runs interceptors on request, response and error", async () => {
    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = new FetchHttpClient({ fetchFn });
    const interceptor: HttpInterceptor = { onRequest, onResponse };
    client.addInterceptor(interceptor);

    await client.get("/x");

    expect(onRequest).toHaveBeenCalledWith(expect.any(HttpRequest));
    expect(onResponse).toHaveBeenCalledWith(expect.objectContaining({ status: 200 }));
  });

  it("lets an error interceptor replace the thrown error", async () => {
    const replacement = new Error("mapped");
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({}, { status: 500 }));
    const client = new FetchHttpClient({ fetchFn });
    client.addInterceptor({ onError: () => replacement });

    const error = await client.get("/x").catch((e) => e);

    expect(error).toBe(replacement);
  });
});
