import type { MedicalAttachment, MedicalRecordWithAttachments } from "@vdp/shared";
import { describe, expect, it, vi } from "vitest";

import { Core } from "@/core/Core";
import { HealthModule } from "@/core/app/health/HealthModule";
import type {
  CreateMedicalRecordInput,
  MedicalGateway,
  UpdateMedicalRecordInput,
} from "@/core/domain/health/medical/MedicalGateway";
import { MedicalPresenter } from "../MedicalPresenter";

class FakeMedicalGateway implements MedicalGateway {
  records: MedicalRecordWithAttachments[] = [];
  failNextUpload = false;
  private seq = 0;

  async getRecords(): Promise<MedicalRecordWithAttachments[]> {
    return this.records;
  }
  async createRecord(input: CreateMedicalRecordInput): Promise<MedicalRecordWithAttachments> {
    this.seq += 1;
    const record: MedicalRecordWithAttachments = {
      id: `rec-${this.seq}`,
      type: input.type,
      title: input.title,
      recordDate: input.recordDate,
      professional: input.professional ?? null,
      specialty: input.specialty ?? null,
      notes: input.notes ?? null,
      createdAt: "2026-06-14T00:00:00.000Z",
      updatedAt: "2026-06-14T00:00:00.000Z",
      attachments: [],
    };
    this.records.push(record);
    return record;
  }
  async updateRecord(id: string, input: UpdateMedicalRecordInput): Promise<MedicalRecordWithAttachments> {
    const record = this.records.find((r) => r.id === id)!;
    Object.assign(record, input);
    return record;
  }
  async deleteRecord(id: string): Promise<void> {
    this.records = this.records.filter((r) => r.id !== id);
  }
  async uploadAttachment(recordId: string, file: File): Promise<MedicalAttachment> {
    if (this.failNextUpload) {
      this.failNextUpload = false;
      throw new Error("upload failed");
    }
    this.seq += 1;
    const attachment: MedicalAttachment = {
      id: `att-${this.seq}`,
      recordId,
      filename: file.name,
      mimeType: "application/pdf",
      sizeBytes: 2048,
      createdAt: "2026-06-14T00:00:00.000Z",
    };
    this.records.find((r) => r.id === recordId)?.attachments.push(attachment);
    return attachment;
  }
  async deleteAttachment(recordId: string, attachmentId: string): Promise<void> {
    const record = this.records.find((r) => r.id === recordId);
    if (record) record.attachments = record.attachments.filter((a) => a.id !== attachmentId);
  }
}

function build() {
  const gateway = new FakeMedicalGateway();
  const core = new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new HealthModule(undefined, gateway));
  const presenter = new MedicalPresenter(vi.fn(), core, "2026-06-14");
  presenter.init(undefined);
  return { presenter, gateway };
}

async function flush() {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

describe("MedicalPresenter", () => {
  it("shows the empty state with no records", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();
    expect(presenter.model.emptyState?.title).toBe("Todavía no hay fichas");
    expect(presenter.model.records).toHaveLength(0);
  });

  it("creates a record and lists it with a Spanish type label", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    presenter.toggleForm();
    presenter.setFormField("type", "estudio");
    presenter.setFormField("title", "Análisis de sangre");
    expect(presenter.model.form?.canSubmit).toBe(true);
    await presenter.submit();

    expect(presenter.model.form).toBeNull();
    expect(presenter.model.records).toHaveLength(1);
    expect(presenter.model.records[0]).toMatchObject({ typeLabel: "Estudio", title: "Análisis de sangre" });
  });

  it("creates a record with an attachment selected in the form", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();

    presenter.toggleForm();
    presenter.setFormField("title", "Resonancia");
    presenter.setPendingFile(new File(["pdf"], "resonancia.pdf", { type: "application/pdf" }));
    expect(presenter.model.form?.selectedFileName).toBe("resonancia.pdf");
    await presenter.submit();

    expect(presenter.model.records).toHaveLength(1);
    expect(presenter.model.records[0].attachments[0]).toMatchObject({
      filename: "resonancia.pdf",
      sizeLabel: "2 KB",
    });
  });

  it("keeps the form open and marks an error when creating with an attachment fails", async () => {
    const { presenter, gateway } = build();
    presenter.start();
    await flush();

    presenter.toggleForm();
    presenter.setFormField("title", "Resonancia");
    presenter.setPendingFile(new File(["pdf"], "resonancia.pdf", { type: "application/pdf" }));
    gateway.failNextUpload = true;

    await expect(presenter.submit()).resolves.toBeUndefined();

    expect(presenter.model.error).toBe(true);
    expect(presenter.model.form?.selectedFileName).toBe("resonancia.pdf");
  });

  it("uploads a file and shows it with a download url + size", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();
    presenter.setFormField("title", "Estudio");
    await presenter.submit();
    const recordId = presenter.model.records[0].id;

    await presenter.uploadFile(recordId, new File(["pdf"], "estudio.pdf", { type: "application/pdf" }));

    const attachment = presenter.model.records[0].attachments[0];
    expect(attachment.filename).toBe("estudio.pdf");
    expect(attachment.sizeLabel).toBe("2 KB");
    expect(attachment.downloadUrl).toBe(
      `/api/v1/health/medical/records/${recordId}/attachments/${attachment.id}/download`,
    );
  });

  it("deletes a record", async () => {
    const { presenter } = build();
    presenter.start();
    await flush();
    presenter.toggleForm();
    presenter.setFormField("title", "Receta");
    await presenter.submit();

    await presenter.deleteRecord(presenter.model.records[0].id);

    expect(presenter.model.records).toHaveLength(0);
  });
});
