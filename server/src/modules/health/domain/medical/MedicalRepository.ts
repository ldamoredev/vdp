import { CreateAttachmentData, MedicalAttachment } from "./MedicalAttachment";
import { CreateMedicalRecordData, MedicalRecord } from "./MedicalRecord";

/**
 * Persistence port for the medical archive. Every method scopes by `userId`
 * (cross-user isolation). Deletes that remove attachments return the orphaned
 * `storageRef`s so the caller can clean up the blobs in FileStorage (which has
 * no FK back to the rows).
 */
export abstract class MedicalRepository {
  // records
  abstract createRecord(userId: string, data: CreateMedicalRecordData): Promise<MedicalRecord>;
  abstract getRecord(userId: string, id: string): Promise<MedicalRecord | null>;
  abstract listRecords(userId: string): Promise<MedicalRecord[]>;
  abstract saveRecord(userId: string, record: MedicalRecord): Promise<MedicalRecord>;
  /** Deletes the record (and its attachment rows); returns removed storage refs. */
  abstract deleteRecord(userId: string, id: string): Promise<string[]>;

  // attachments
  abstract addAttachment(userId: string, recordId: string, data: CreateAttachmentData): Promise<MedicalAttachment>;
  abstract listAttachments(userId: string, recordIds: string[]): Promise<MedicalAttachment[]>;
  abstract getAttachment(userId: string, attachmentId: string): Promise<MedicalAttachment | null>;
  /** Deletes the attachment row; returns its storage ref, or null if not found. */
  abstract deleteAttachment(userId: string, attachmentId: string): Promise<string | null>;
}
