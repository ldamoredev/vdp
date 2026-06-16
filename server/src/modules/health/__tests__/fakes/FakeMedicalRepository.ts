import { CreateAttachmentData, MedicalAttachment } from "../../domain/medical/MedicalAttachment";
import { CreateMedicalRecordData, MedicalRecord } from "../../domain/medical/MedicalRecord";
import { MedicalRepository } from "../../domain/medical/MedicalRepository";

type OwnedRecord = { userId: string; record: MedicalRecord };
type OwnedAttachment = { userId: string; att: MedicalAttachment };

export class FakeMedicalRepository extends MedicalRepository {
  private records: OwnedRecord[] = [];
  private attachments: OwnedAttachment[] = [];
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  async createRecord(userId: string, data: CreateMedicalRecordData): Promise<MedicalRecord> {
    const record = MedicalRecord.fromSnapshot({
      id: this.nextId("rec"),
      type: data.type,
      title: data.title,
      recordDate: data.recordDate,
      professional: data.professional ?? null,
      specialty: data.specialty ?? null,
      notes: data.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.records.push({ userId, record });
    return record;
  }

  async getRecord(userId: string, id: string): Promise<MedicalRecord | null> {
    return this.records.find((x) => x.userId === userId && x.record.id === id)?.record ?? null;
  }

  async listRecords(userId: string): Promise<MedicalRecord[]> {
    return this.records.filter((x) => x.userId === userId).map((x) => x.record);
  }

  async saveRecord(_userId: string, record: MedicalRecord): Promise<MedicalRecord> {
    return record; // mutated in place by the entity
  }

  async deleteRecord(userId: string, id: string): Promise<string[]> {
    const refs = this.attachments
      .filter((x) => x.userId === userId && x.att.recordId === id)
      .map((x) => x.att.storageRef);
    this.attachments = this.attachments.filter((x) => !(x.userId === userId && x.att.recordId === id));
    this.records = this.records.filter((x) => !(x.userId === userId && x.record.id === id));
    return refs;
  }

  async addAttachment(userId: string, recordId: string, data: CreateAttachmentData): Promise<MedicalAttachment> {
    const att = MedicalAttachment.fromSnapshot({
      id: this.nextId("att"),
      recordId,
      filename: data.filename,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      storageRef: data.storageRef,
      createdAt: new Date(),
    });
    this.attachments.push({ userId, att });
    return att;
  }

  async listAttachments(userId: string, recordIds: string[]): Promise<MedicalAttachment[]> {
    return this.attachments
      .filter((x) => x.userId === userId && recordIds.includes(x.att.recordId))
      .map((x) => x.att);
  }

  async getAttachment(userId: string, attachmentId: string): Promise<MedicalAttachment | null> {
    return this.attachments.find((x) => x.userId === userId && x.att.id === attachmentId)?.att ?? null;
  }

  async deleteAttachment(userId: string, attachmentId: string): Promise<string | null> {
    const found = this.attachments.find((x) => x.userId === userId && x.att.id === attachmentId);
    if (!found) return null;
    this.attachments = this.attachments.filter((x) => x !== found);
    return found.att.storageRef;
  }
}
