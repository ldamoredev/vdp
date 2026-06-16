import type { MedicalRecordType } from "@vdp/shared";

export interface MedicalViewModel {
  title: string;
  intro: string;
  privacyNote: string;
  addButtonLabel: string;
  form: MedicalFormVM | null;
  records: MedicalRecordVM[];
  emptyState: { title: string; body: string } | null;
  isLoading: boolean;
  error: boolean;
}

export type MedicalFormField =
  | "type"
  | "title"
  | "recordDate"
  | "professional"
  | "specialty"
  | "notes";

export interface SelectOptionVM {
  value: string;
  label: string;
}

export interface MedicalFormVM {
  type: MedicalRecordType;
  title: string;
  recordDate: string;
  professional: string;
  specialty: string;
  notes: string;
  attachmentLabel: string;
  attachmentHint: string;
  chooseFileLabel: string;
  clearFileLabel: string;
  selectedFileName: string | null;
  typeOptions: SelectOptionVM[];
  submitLabel: string;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export interface MedicalAttachmentVM {
  id: string;
  filename: string;
  sizeLabel: string;
  downloadUrl: string;
}

export interface MedicalRecordVM {
  id: string;
  typeLabel: string;
  title: string;
  dateLabel: string;
  metaLabel: string | null;
  notes: string | null;
  attachments: MedicalAttachmentVM[];
  isBusy: boolean;
  isUploading: boolean;
}
