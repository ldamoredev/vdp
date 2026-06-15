import { and, desc, eq, inArray } from "drizzle-orm";

import { Database } from "../../../common/base/db/Database";
import { CreateAttachmentData, MedicalAttachment } from "../../domain/MedicalAttachment";
import { CreateMedicalRecordData, MedicalRecord, MedicalRecordType } from "../../domain/MedicalRecord";
import { MedicalRepository } from "../../domain/MedicalRepository";
import { medicalAttachments, medicalRecords } from "./schema";

export class DrizzleMedicalRepository extends MedicalRepository {
  constructor(private readonly db: Database) {
    super();
  }

  async createRecord(userId: string, data: CreateMedicalRecordData): Promise<MedicalRecord> {
    const [row] = await this.db.query
      .insert(medicalRecords)
      .values({
        ownerUserId: userId,
        type: data.type,
        title: data.title,
        recordDate: data.recordDate,
        professional: data.professional ?? null,
        specialty: data.specialty ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return this.toRecord(row);
  }

  async getRecord(userId: string, id: string): Promise<MedicalRecord | null> {
    const [row] = await this.db.query
      .select()
      .from(medicalRecords)
      .where(and(eq(medicalRecords.id, id), eq(medicalRecords.ownerUserId, userId)))
      .limit(1);
    return row ? this.toRecord(row) : null;
  }

  async listRecords(userId: string): Promise<MedicalRecord[]> {
    const rows = await this.db.query
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.ownerUserId, userId))
      .orderBy(desc(medicalRecords.recordDate), desc(medicalRecords.createdAt));
    return rows.map((row) => this.toRecord(row));
  }

  async saveRecord(userId: string, record: MedicalRecord): Promise<MedicalRecord> {
    const s = record.toSnapshot();
    const [row] = await this.db.query
      .update(medicalRecords)
      .set({
        type: s.type,
        title: s.title,
        recordDate: s.recordDate,
        professional: s.professional,
        specialty: s.specialty,
        notes: s.notes,
        updatedAt: s.updatedAt,
      })
      .where(and(eq(medicalRecords.id, s.id), eq(medicalRecords.ownerUserId, userId)))
      .returning();
    return this.toRecord(row);
  }

  async deleteRecord(userId: string, id: string): Promise<string[]> {
    const refs = await this.db.query
      .select({ storageRef: medicalAttachments.storageRef })
      .from(medicalAttachments)
      .where(and(eq(medicalAttachments.recordId, id), eq(medicalAttachments.ownerUserId, userId)));
    await this.db.query
      .delete(medicalRecords)
      .where(and(eq(medicalRecords.id, id), eq(medicalRecords.ownerUserId, userId)));
    return refs.map((r) => r.storageRef);
  }

  async addAttachment(userId: string, recordId: string, data: CreateAttachmentData): Promise<MedicalAttachment> {
    const [row] = await this.db.query
      .insert(medicalAttachments)
      .values({
        ownerUserId: userId,
        recordId,
        filename: data.filename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageRef: data.storageRef,
      })
      .returning();
    return this.toAttachment(row);
  }

  async listAttachments(userId: string, recordIds: string[]): Promise<MedicalAttachment[]> {
    if (recordIds.length === 0) return [];
    const rows = await this.db.query
      .select()
      .from(medicalAttachments)
      .where(and(eq(medicalAttachments.ownerUserId, userId), inArray(medicalAttachments.recordId, recordIds)))
      .orderBy(medicalAttachments.createdAt);
    return rows.map((row) => this.toAttachment(row));
  }

  async getAttachment(userId: string, attachmentId: string): Promise<MedicalAttachment | null> {
    const [row] = await this.db.query
      .select()
      .from(medicalAttachments)
      .where(and(eq(medicalAttachments.id, attachmentId), eq(medicalAttachments.ownerUserId, userId)))
      .limit(1);
    return row ? this.toAttachment(row) : null;
  }

  async deleteAttachment(userId: string, attachmentId: string): Promise<string | null> {
    const [row] = await this.db.query
      .delete(medicalAttachments)
      .where(and(eq(medicalAttachments.id, attachmentId), eq(medicalAttachments.ownerUserId, userId)))
      .returning({ storageRef: medicalAttachments.storageRef });
    return row ? row.storageRef : null;
  }

  private toRecord(row: typeof medicalRecords.$inferSelect): MedicalRecord {
    return MedicalRecord.fromSnapshot({
      id: row.id,
      type: row.type as MedicalRecordType,
      title: row.title,
      recordDate: row.recordDate,
      professional: row.professional,
      specialty: row.specialty,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toAttachment(row: typeof medicalAttachments.$inferSelect): MedicalAttachment {
    return MedicalAttachment.fromSnapshot({
      id: row.id,
      recordId: row.recordId,
      filename: row.filename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      storageRef: row.storageRef,
      createdAt: row.createdAt,
    });
  }
}
