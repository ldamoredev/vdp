import type { MedicalRecordType } from "@vdp/shared";

export type { MedicalRecordType };

/**
 * A medical archive entry (consulta / estudio / vacuna / receta / otro):
 * structured metadata about a document or event. The actual files hang off it
 * as MedicalAttachment rows. Immutable-snapshot entity, like the rest of the
 * domain.
 */
export class MedicalRecord {
  constructor(
    public id: string,
    public type: MedicalRecordType,
    public title: string,
    public recordDate: string,
    public professional: string | null,
    public specialty: string | null,
    public notes: string | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  update(data: UpdateMedicalRecordData): void {
    if (data.type !== undefined) this.type = data.type;
    if (data.title !== undefined) this.title = data.title;
    if (data.recordDate !== undefined) this.recordDate = data.recordDate;
    if (data.professional !== undefined) this.professional = data.professional;
    if (data.specialty !== undefined) this.specialty = data.specialty;
    if (data.notes !== undefined) this.notes = data.notes;
    this.updatedAt = new Date();
  }

  toSnapshot(): MedicalRecordSnapshot {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      recordDate: this.recordDate,
      professional: this.professional,
      specialty: this.specialty,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromSnapshot(s: MedicalRecordSnapshot): MedicalRecord {
    return new MedicalRecord(
      s.id,
      s.type,
      s.title,
      s.recordDate,
      s.professional,
      s.specialty,
      s.notes,
      s.createdAt,
      s.updatedAt,
    );
  }
}

export type MedicalRecordSnapshot = {
  id: string;
  type: MedicalRecordType;
  title: string;
  recordDate: string;
  professional: string | null;
  specialty: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMedicalRecordData = {
  readonly type: MedicalRecordType;
  readonly title: string;
  readonly recordDate: string;
  readonly professional?: string | null;
  readonly specialty?: string | null;
  readonly notes?: string | null;
};

export type UpdateMedicalRecordData = Partial<CreateMedicalRecordData>;
