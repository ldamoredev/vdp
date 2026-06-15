import type { MedicalAttachment as WireAttachment, MedicalRecordWithAttachments } from "@vdp/shared";

import { MedicalAttachment } from "../domain/MedicalAttachment";
import { MedicalRecord } from "../domain/MedicalRecord";

export function toAttachmentResponse(a: MedicalAttachment): WireAttachment {
  return {
    id: a.id,
    recordId: a.recordId,
    filename: a.filename,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    createdAt: a.createdAt.toISOString(),
  };
}

export function toRecordResponse(
  record: MedicalRecord,
  attachments: MedicalAttachment[],
): MedicalRecordWithAttachments {
  const s = record.toSnapshot();
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    recordDate: s.recordDate,
    professional: s.professional,
    specialty: s.specialty,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    attachments: attachments.map(toAttachmentResponse),
  };
}
