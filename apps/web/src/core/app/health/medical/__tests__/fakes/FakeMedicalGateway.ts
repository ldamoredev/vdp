import type { MedicalAttachment, MedicalRecordWithAttachments } from "@vdp/shared";

import type {
  CreateMedicalRecordInput,
  MedicalGateway,
  UpdateMedicalRecordInput,
} from "../../../../../domain/health/medical/MedicalGateway";

export interface RecordedCall {
  method: string;
  args: unknown[];
}

function emptyRecord(overrides: Partial<MedicalRecordWithAttachments> = {}): MedicalRecordWithAttachments {
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

export class FakeMedicalGateway implements MedicalGateway {
  readonly calls: RecordedCall[] = [];
  records: MedicalRecordWithAttachments[] = [];
  private seq = 0;

  callsTo(method: string): RecordedCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  private record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  async getRecords(): Promise<MedicalRecordWithAttachments[]> {
    this.record("getRecords");
    return this.records;
  }

  async createRecord(input: CreateMedicalRecordInput): Promise<MedicalRecordWithAttachments> {
    this.record("createRecord", input);
    this.seq += 1;
    const record = emptyRecord({
      id: `rec-${this.seq}`,
      type: input.type,
      title: input.title,
      recordDate: input.recordDate,
      professional: input.professional ?? null,
      specialty: input.specialty ?? null,
      notes: input.notes ?? null,
    });
    this.records.push(record);
    return record;
  }

  async updateRecord(id: string, input: UpdateMedicalRecordInput): Promise<MedicalRecordWithAttachments> {
    this.record("updateRecord", id, input);
    const current = this.records.find((record) => record.id === id) ?? emptyRecord({ id });
    const updated = { ...current, ...input };
    this.records = this.records.map((record) => (record.id === id ? updated : record));
    return updated;
  }

  async deleteRecord(id: string): Promise<void> {
    this.record("deleteRecord", id);
    this.records = this.records.filter((record) => record.id !== id);
  }

  async uploadAttachment(recordId: string, file: File): Promise<MedicalAttachment> {
    this.record("uploadAttachment", recordId, file);
    this.seq += 1;
    const attachment: MedicalAttachment = {
      id: `att-${this.seq}`,
      recordId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      createdAt: "2026-06-10T00:00:00.000Z",
    };
    this.records.find((record) => record.id === recordId)?.attachments.push(attachment);
    return attachment;
  }

  async deleteAttachment(recordId: string, attachmentId: string): Promise<void> {
    this.record("deleteAttachment", recordId, attachmentId);
    const record = this.records.find((item) => item.id === recordId);
    if (record) record.attachments = record.attachments.filter((attachment) => attachment.id !== attachmentId);
  }
}
