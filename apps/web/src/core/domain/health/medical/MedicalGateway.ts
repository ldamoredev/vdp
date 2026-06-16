import type {
  MedicalAttachment,
  MedicalRecordType,
  MedicalRecordWithAttachments,
} from "@vdp/shared";

export type {
  MedicalAttachment,
  MedicalRecordType,
  MedicalRecordWithAttachments,
} from "@vdp/shared";

export interface CreateMedicalRecordInput {
  type: MedicalRecordType;
  title: string;
  recordDate: string;
  professional?: string | null;
  specialty?: string | null;
  notes?: string | null;
}

export type UpdateMedicalRecordInput = Partial<CreateMedicalRecordInput>;

/**
 * Port for the medical backend. Records carry their attachments inline. File
 * bytes are never modeled here: uploads send a File, downloads are a plain
 * same-origin URL the browser fetches with the session cookie.
 */
export interface MedicalGateway {
  getRecords(): Promise<MedicalRecordWithAttachments[]>;
  createRecord(input: CreateMedicalRecordInput): Promise<MedicalRecordWithAttachments>;
  updateRecord(id: string, input: UpdateMedicalRecordInput): Promise<MedicalRecordWithAttachments>;
  deleteRecord(id: string): Promise<void>;
  uploadAttachment(recordId: string, file: File): Promise<MedicalAttachment>;
  deleteAttachment(recordId: string, attachmentId: string): Promise<void>;
}
