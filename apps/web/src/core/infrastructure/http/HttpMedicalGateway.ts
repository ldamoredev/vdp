import { HttpClient } from "@nbottarini/abstract-http-client";
import type {
  MedicalAttachment,
  MedicalRecordsResponse,
  MedicalRecordWithAttachments,
} from "@vdp/shared";

import type {
  CreateMedicalRecordInput,
  MedicalGateway,
  UpdateMedicalRecordInput,
} from "../../domain/health/medical/MedicalGateway";

const M = "/health/medical";

/**
 * HTTP adapter for the medical backend. Attachment uploads go out as
 * multipart/form-data (FetchHttpClient passes a FormData body through without a
 * JSON Content-Type, so the browser sets the multipart boundary). Downloads are
 * not fetched here — the view links straight to the same-origin URL.
 */
export class HttpMedicalGateway implements MedicalGateway {
  constructor(private readonly http: HttpClient) {}

  async getRecords(): Promise<MedicalRecordWithAttachments[]> {
    const { body } = await this.http.get<MedicalRecordsResponse>(`${M}/records`);
    return body.records;
  }

  async createRecord(input: CreateMedicalRecordInput): Promise<MedicalRecordWithAttachments> {
    const { body } = await this.http.post<MedicalRecordWithAttachments>(`${M}/records`, input);
    return body;
  }

  async updateRecord(
    id: string,
    input: UpdateMedicalRecordInput,
  ): Promise<MedicalRecordWithAttachments> {
    const { body } = await this.http.put<MedicalRecordWithAttachments>(`${M}/records/${id}`, input);
    return body;
  }

  async deleteRecord(id: string): Promise<void> {
    await this.http.delete(`${M}/records/${id}`);
  }

  async uploadAttachment(recordId: string, file: File): Promise<MedicalAttachment> {
    const form = new FormData();
    form.append("file", file, file.name);
    const { body } = await this.http.post<MedicalAttachment>(
      `${M}/records/${recordId}/attachments`,
      form,
    );
    return body;
  }

  async deleteAttachment(recordId: string, attachmentId: string): Promise<void> {
    await this.http.delete(`${M}/records/${recordId}/attachments/${attachmentId}`);
  }
}
