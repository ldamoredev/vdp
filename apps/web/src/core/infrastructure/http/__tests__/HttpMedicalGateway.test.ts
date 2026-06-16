import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type { MedicalAttachment, MedicalRecordsResponse, MedicalRecordWithAttachments } from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { HttpMedicalGateway } from "../HttpMedicalGateway";

interface RecordedCall {
  method: HttpMethods;
  url: string;
  body: unknown;
}

class FakeHttpClient implements HttpClient {
  readonly calls: RecordedCall[] = [];
  constructor(private readonly responses: Record<string, unknown> = {}) {}

  get<T = any>(url: string) {
    return this.record<T>(HttpMethods.GET, url, undefined);
  }
  post<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.POST, url, body);
  }
  put<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PUT, url, body);
  }
  patch<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PATCH, url, body);
  }
  delete<T = any>(url: string) {
    return this.record<T>(HttpMethods.DELETE, url, undefined);
  }
  head<T = any>(url: string) {
    return this.record<T>(HttpMethods.HEAD, url, undefined);
  }
  send<T = any>(request: HttpRequest) {
    return this.record<T>(request.method, request.url, request.body);
  }
  addInterceptor() {}

  private async record<T>(method: HttpMethods, url: string, body: unknown): Promise<HttpResponse<T>> {
    this.calls.push({ method, url, body });
    return {
      method,
      url,
      status: 200,
      statusText: "OK",
      headers: {},
      body: (this.responses[`${method} ${url}`] ?? {}) as T,
      request: new HttpRequest(method, url, body),
    };
  }
}

function recordDto(overrides: Partial<MedicalRecordWithAttachments> = {}): MedicalRecordWithAttachments {
  return {
    id: "rec-1",
    type: "consulta",
    title: "Control clinico",
    recordDate: "2026-06-10",
    professional: null,
    specialty: null,
    notes: null,
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    attachments: [],
    ...overrides,
  };
}

function attachmentDto(overrides: Partial<MedicalAttachment> = {}): MedicalAttachment {
  return {
    id: "att-1",
    recordId: "rec-1",
    filename: "estudio.pdf",
    mimeType: "application/pdf",
    sizeBytes: 4,
    createdAt: "2026-06-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("HttpMedicalGateway", () => {
  it("lists medical records from the archive endpoint", async () => {
    const body: MedicalRecordsResponse = { records: [recordDto({ title: "Laboratorio" })] };
    const http = new FakeHttpClient({ "GET /health/medical/records": body });

    const result = await new HttpMedicalGateway(http).getRecords();

    expect(result[0].title).toBe("Laboratorio");
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/health/medical/records" });
  });

  it("posts the create-record body", async () => {
    const http = new FakeHttpClient({
      "POST /health/medical/records": recordDto({ title: "Control" }),
    });

    await new HttpMedicalGateway(http).createRecord({
      type: "consulta",
      title: "Control",
      recordDate: "2026-06-10",
    });

    expect(http.calls[0]).toMatchObject({
      method: "POST",
      url: "/health/medical/records",
      body: { type: "consulta", title: "Control", recordDate: "2026-06-10" },
    });
  });

  it("puts the update-record patch", async () => {
    const http = new FakeHttpClient({
      "PUT /health/medical/records/rec-1": recordDto({ notes: "Traer resultados" }),
    });

    await new HttpMedicalGateway(http).updateRecord("rec-1", { notes: "Traer resultados" });

    expect(http.calls[0]).toMatchObject({
      method: "PUT",
      url: "/health/medical/records/rec-1",
      body: { notes: "Traer resultados" },
    });
  });

  it("uploads a file as multipart form data", async () => {
    const http = new FakeHttpClient({
      "POST /health/medical/records/rec-1/attachments": attachmentDto(),
    });
    const file = new File(["%PDF"], "estudio.pdf", { type: "application/pdf" });

    const result = await new HttpMedicalGateway(http).uploadAttachment("rec-1", file);

    expect(result.filename).toBe("estudio.pdf");
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/health/medical/records/rec-1/attachments" });
    expect(http.calls[0].body).toBeInstanceOf(FormData);
    const formFile = (http.calls[0].body as FormData).get("file") as File;
    expect(formFile.name).toBe("estudio.pdf");
    expect(formFile.type).toBe("application/pdf");
    expect(formFile.size).toBe(4);
  });

  it("deletes records and attachments through their scoped URLs", async () => {
    const http = new FakeHttpClient();
    const gateway = new HttpMedicalGateway(http);

    await gateway.deleteRecord("rec-1");
    await gateway.deleteAttachment("rec-1", "att-1");

    expect(http.calls[0]).toMatchObject({ method: "DELETE", url: "/health/medical/records/rec-1" });
    expect(http.calls[1]).toMatchObject({
      method: "DELETE",
      url: "/health/medical/records/rec-1/attachments/att-1",
    });
  });
});
