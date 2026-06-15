// ─── Medical records API response types ──────────────────
//
// The personal medical archive (H3): structured records + file attachments.
// Privacy: the most sensitive data in the system — NOT exposed through agent
// tools. Dates are ISO strings on the wire.

export type MedicalRecordType =
  | "consulta"
  | "estudio"
  | "vacuna"
  | "receta"
  | "otro";

export interface MedicalAttachment {
  id: string;
  recordId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  type: MedicalRecordType;
  title: string;
  recordDate: string;
  professional: string | null;
  specialty: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecordWithAttachments extends MedicalRecord {
  attachments: MedicalAttachment[];
}

export interface MedicalRecordsResponse {
  records: MedicalRecordWithAttachments[];
}
