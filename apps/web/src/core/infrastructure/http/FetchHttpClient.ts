import {
  HttpClient,
  HttpError,
  HttpInterceptor,
  HttpMethods,
  HttpRequest,
  HttpResponse,
  NetworkError,
  RequestOptions,
  ResponseBodyConversions,
} from "@nbottarini/abstract-http-client";

export interface FetchHttpClientOptions {
  baseUrl?: string;
  /**
   * Forwarded to fetch(). Defaults to "same-origin" so the vdp_session cookie
   * rides along with API calls (the SPA is served same-origin with the API).
   */
  credentials?: RequestCredentials;
  /** Injectable for tests; defaults to the global fetch. */
  fetchFn?: typeof fetch;
}

/**
 * fetch-based implementation of abstract-http-client's HttpClient. Replaces the
 * axios-http-client package (which pins a CVE-bearing axios 0.27). Throws
 * HttpError on non-2xx responses and NetworkError when the request never
 * reaches the server, so gateways can map failures to domain errors.
 */
export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly credentials: RequestCredentials;
  private readonly fetchFn: typeof fetch;
  private readonly interceptors: HttpInterceptor[] = [];

  constructor(options: FetchHttpClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "").replace(/\/$/, "");
    this.credentials = options.credentials ?? "same-origin";
    this.fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  get<T = any>(url: string, headers?: Record<string, string>, options?: RequestOptions) {
    return this.send<T>(new HttpRequest(HttpMethods.GET, url, undefined, headers, options));
  }

  post<T = any>(url: string, body: any, headers?: Record<string, string>, options?: RequestOptions) {
    return this.send<T>(new HttpRequest(HttpMethods.POST, url, body, headers, options));
  }

  put<T = any>(url: string, body: any, headers?: Record<string, string>, options?: RequestOptions) {
    return this.send<T>(new HttpRequest(HttpMethods.PUT, url, body, headers, options));
  }

  patch<T = any>(url: string, body: any, headers?: Record<string, string>, options?: RequestOptions) {
    return this.send<T>(new HttpRequest(HttpMethods.PATCH, url, body, headers, options));
  }

  delete<T = any>(url: string, headers?: Record<string, string>, options?: RequestOptions) {
    return this.send<T>(new HttpRequest(HttpMethods.DELETE, url, undefined, headers, options));
  }

  head<T = any>(url: string, headers?: Record<string, string>, options?: RequestOptions) {
    return this.send<T>(new HttpRequest(HttpMethods.HEAD, url, undefined, headers, options));
  }

  addInterceptor(interceptor: HttpInterceptor): void {
    this.interceptors.push(interceptor);
  }

  async send<T = any>(request: HttpRequest): Promise<HttpResponse<T>> {
    for (const interceptor of this.interceptors) {
      await interceptor.onRequest?.(request);
    }

    let raw: Response;
    try {
      raw = await this.fetchFn(this.resolveUrl(request.url), {
        method: request.method,
        headers: this.buildHeaders(request),
        body: this.serializeBody(request),
        credentials: this.credentials,
      });
    } catch (cause) {
      throw this.runErrorInterceptors(
        new NetworkError(request, null, cause instanceof Error ? cause : null),
        request,
      );
    }

    const response = await this.buildResponse<T>(request, raw);

    if (!raw.ok) {
      throw this.runErrorInterceptors(new HttpError(request, response), request);
    }

    for (const interceptor of this.interceptors) {
      await interceptor.onResponse?.(response);
    }
    return response;
  }

  private resolveUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  }

  private buildHeaders(request: HttpRequest): Record<string, string> {
    const headers: Record<string, string> = { ...request.headers };
    const hasBody = request.body !== undefined && request.body !== null;
    const isPlainObject = hasBody && typeof request.body === "object" && !(request.body instanceof FormData);
    if (isPlainObject && !this.hasHeader(headers, "content-type")) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  private serializeBody(request: HttpRequest): BodyInit | undefined {
    const { body } = request;
    if (body === undefined || body === null) return undefined;
    if (typeof body === "string" || body instanceof FormData || body instanceof Blob) return body;
    return JSON.stringify(body);
  }

  private async buildResponse<T>(request: HttpRequest, raw: Response): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = {};
    raw.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      method: request.method,
      status: raw.status,
      statusText: raw.statusText,
      url: raw.url || this.resolveUrl(request.url),
      headers,
      body: (await this.parseBody(raw, request.options?.responseBodyConversion)) as T,
      request,
    };
  }

  private async parseBody(raw: Response, conversion?: ResponseBodyConversions): Promise<unknown> {
    if (conversion === ResponseBodyConversions.ArrayBuffer) return raw.arrayBuffer();
    if (conversion === ResponseBodyConversions.Stream) return raw.body;
    if (raw.status === 204) return undefined;

    const text = await raw.text();
    if (!text) return undefined;
    const contentType = raw.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  }

  private runErrorInterceptors(error: Error, request: HttpRequest): Error {
    return this.interceptors.reduce(
      (current, interceptor) => interceptor.onError?.(current, request) ?? current,
      error,
    );
  }

  private hasHeader(headers: Record<string, string>, name: string): boolean {
    return Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());
  }
}
