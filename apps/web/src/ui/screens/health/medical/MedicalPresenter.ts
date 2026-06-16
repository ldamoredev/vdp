import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { MedicalRecordType, MedicalRecordWithAttachments } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { CreateMedicalRecord } from "@/core/app/health/medical/CreateMedicalRecord";
import { DeleteAttachment } from "@/core/app/health/medical/DeleteAttachment";
import { DeleteMedicalRecord } from "@/core/app/health/medical/DeleteMedicalRecord";
import { GetMedicalRecords } from "@/core/app/health/medical/GetMedicalRecords";
import { UploadAttachment } from "@/core/app/health/medical/UploadAttachment";
import { formatDate } from "@/lib/format";
import type {
  MedicalAttachmentVM,
  MedicalFormField,
  MedicalRecordVM,
  MedicalViewModel,
} from "@/ui/models/health/medical/MedicalViewModel";

interface MedicalFormState {
  type: MedicalRecordType;
  title: string;
  recordDate: string;
  professional: string;
  specialty: string;
  notes: string;
}

const TYPE_OPTIONS = [
  { value: "consulta", label: "Consulta" },
  { value: "estudio", label: "Estudio" },
  { value: "vacuna", label: "Vacuna" },
  { value: "receta", label: "Receta" },
  { value: "otro", label: "Otro" },
];

const TYPE_LABELS: Record<MedicalRecordType, string> = {
  consulta: "Consulta",
  estudio: "Estudio",
  vacuna: "Vacuna",
  receta: "Receta",
  otro: "Otro",
};

function emptyForm(today: string): MedicalFormState {
  return { type: "consulta", title: "", recordDate: today, professional: "", specialty: "", notes: "" };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Drives the medical archive screen: loads records (with their attachments),
 * owns the create form and per-record file upload / delete. Mutations dispatch
 * via the Core bus and reload. Download is a plain link in the view (the browser
 * GETs the same-origin URL with the session cookie). Spanish copy lives here.
 */
export class MedicalPresenter extends PresenterBase<MedicalViewModel> {
  private records: MedicalRecordWithAttachments[] = [];
  private isLoading = true;
  private error = false;

  private showForm = false;
  private form: MedicalFormState;
  private pendingFile: File | null = null;
  private isCreating = false;

  private busyIds = new Set<string>();
  private uploadingIds = new Set<string>();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly today: string,
  ) {
    super(onChange);
    this.form = emptyForm(today);
  }

  protected initModel(): MedicalViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  stop(): void {}

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.form = emptyForm(this.today);
      this.pendingFile = null;
    }
    this.refresh();
  }

  setFormField(field: MedicalFormField, value: string): void {
    if (field === "type") this.form.type = value as MedicalRecordType;
    else this.form[field] = value;
    this.refresh();
  }

  setPendingFile(file: File | null): void {
    this.pendingFile = file;
    this.refresh();
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.isCreating = true;
    this.refresh();
    try {
      const record = await this.core.execute(
        new CreateMedicalRecord({
          type: this.form.type,
          title: this.form.title.trim(),
          recordDate: this.form.recordDate,
          professional: this.form.professional.trim() || null,
          specialty: this.form.specialty.trim() || null,
          notes: this.form.notes.trim() || null,
        }),
      );
      if (this.pendingFile) {
        await this.core.execute(new UploadAttachment(record.id, this.pendingFile));
      }
      this.error = false;
      this.showForm = false;
      this.form = emptyForm(this.today);
      this.pendingFile = null;
      await this.load();
    } catch {
      this.error = true;
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  async deleteRecord(id: string): Promise<void> {
    await this.runForId(id, async () => {
      await this.core.execute(new DeleteMedicalRecord(id));
      await this.load();
    });
  }

  async uploadFile(recordId: string, file: File): Promise<void> {
    if (this.uploadingIds.has(recordId)) return;
    this.uploadingIds.add(recordId);
    this.refresh();
    try {
      await this.core.execute(new UploadAttachment(recordId, file));
      await this.load();
    } catch {
      this.error = true;
    } finally {
      this.uploadingIds.delete(recordId);
      this.refresh();
    }
  }

  async deleteAttachment(recordId: string, attachmentId: string): Promise<void> {
    await this.runForId(recordId, async () => {
      await this.core.execute(new DeleteAttachment(recordId, attachmentId));
      await this.load();
    });
  }

  private async load(): Promise<void> {
    this.isLoading = true;
    this.refresh();
    try {
      this.records = await this.core.execute(new GetMedicalRecords());
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async runForId(id: string, block: () => Promise<void>): Promise<void> {
    if (this.busyIds.has(id)) return;
    this.busyIds.add(id);
    this.refresh();
    try {
      await block();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private canSubmit(): boolean {
    return this.form.title.trim().length > 0 && this.form.recordDate.length > 0 && !this.isCreating;
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): MedicalViewModel {
    return {
      title: "Fichas médicas",
      intro: "Tu archivo médico personal: consultas, estudios, vacunas y recetas, con los documentos adjuntos.",
      privacyNote: "Privado: las fichas médicas no son accesibles por el asistente de IA.",
      addButtonLabel: "Nueva ficha",
      form: this.showForm
        ? {
            type: this.form.type,
            title: this.form.title,
            recordDate: this.form.recordDate,
            professional: this.form.professional,
            specialty: this.form.specialty,
            notes: this.form.notes,
            attachmentLabel: "Archivo médico",
            attachmentHint: "Podés adjuntar un PDF o imagen ahora, o hacerlo después desde la ficha.",
            chooseFileLabel: this.pendingFile ? "Cambiar archivo" : "Elegir archivo",
            clearFileLabel: "Quitar",
            selectedFileName: this.pendingFile?.name ?? null,
            typeOptions: TYPE_OPTIONS,
            submitLabel: this.isCreating ? "Guardando..." : "Guardar ficha",
            isSubmitting: this.isCreating,
            canSubmit: this.canSubmit(),
          }
        : null,
      records: this.records.map((record) => this.recordVM(record)),
      emptyState:
        !this.isLoading && this.records.length === 0
          ? {
              title: "Todavía no hay fichas",
              body: "Creá una ficha para guardar consultas, estudios o recetas, y adjuntá sus documentos.",
            }
          : null,
      isLoading: this.isLoading,
      error: this.error,
    };
  }

  private recordVM(record: MedicalRecordWithAttachments): MedicalRecordVM {
    const meta = [record.professional, record.specialty].filter(Boolean).join(" · ");
    return {
      id: record.id,
      typeLabel: TYPE_LABELS[record.type] ?? record.type,
      title: record.title,
      dateLabel: formatDate(record.recordDate),
      metaLabel: meta.length > 0 ? meta : null,
      notes: record.notes,
      attachments: record.attachments.map((a) => this.attachmentVM(record.id, a)),
      isBusy: this.busyIds.has(record.id),
      isUploading: this.uploadingIds.has(record.id),
    };
  }

  private attachmentVM(
    recordId: string,
    attachment: MedicalRecordWithAttachments["attachments"][number],
  ): MedicalAttachmentVM {
    return {
      id: attachment.id,
      filename: attachment.filename,
      sizeLabel: formatBytes(attachment.sizeBytes),
      downloadUrl: `/api/v1/health/medical/records/${recordId}/attachments/${attachment.id}/download`,
    };
  }
}
