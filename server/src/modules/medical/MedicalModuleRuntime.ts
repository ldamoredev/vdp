import { ModuleContext } from "../common/base/modules/ModuleContext";
import { FileStorage } from "../common/base/storage/FileStorage";
import { CreateMedicalRecordCommand, CreateMedicalRecordCommandHandler } from "./app/CreateMedicalRecordCommand";
import { DeleteAttachmentCommand, DeleteAttachmentCommandHandler } from "./app/DeleteAttachmentCommand";
import { DeleteMedicalRecordCommand, DeleteMedicalRecordCommandHandler } from "./app/DeleteMedicalRecordCommand";
import { DownloadAttachmentQuery, DownloadAttachmentQueryHandler } from "./app/DownloadAttachmentQuery";
import { GetMedicalRecordsQuery, GetMedicalRecordsQueryHandler } from "./app/GetMedicalRecordsQuery";
import { UpdateMedicalRecordCommand, UpdateMedicalRecordCommandHandler } from "./app/UpdateMedicalRecordCommand";
import { UploadAttachmentCommand, UploadAttachmentCommandHandler } from "./app/UploadAttachmentCommand";
import { MedicalRepository } from "./domain/MedicalRepository";
import { MedicalController } from "./infrastructure/routes/MedicalController";

export class MedicalModuleRuntime {
  constructor(private deps: ModuleContext) {}

  registerServices(): void {
    // No use-case services: the medical module is built directly on cqbus handlers.
  }

  registerHandlers(): void {
    const repo = this.medicalRepository();
    const storage = this.fileStorage();

    this.deps.bus.registerHandler(GetMedicalRecordsQuery, () => new GetMedicalRecordsQueryHandler(repo));
    this.deps.bus.registerHandler(CreateMedicalRecordCommand, () => new CreateMedicalRecordCommandHandler(repo));
    this.deps.bus.registerHandler(UpdateMedicalRecordCommand, () => new UpdateMedicalRecordCommandHandler(repo));
    this.deps.bus.registerHandler(DeleteMedicalRecordCommand, () => new DeleteMedicalRecordCommandHandler(repo, storage));
    this.deps.bus.registerHandler(UploadAttachmentCommand, () => new UploadAttachmentCommandHandler(repo, storage));
    this.deps.bus.registerHandler(DownloadAttachmentQuery, () => new DownloadAttachmentQueryHandler(repo, storage));
    this.deps.bus.registerHandler(DeleteAttachmentCommand, () => new DeleteAttachmentCommandHandler(repo, storage));
  }

  registerEventHandlers(): void {
    // No cross-domain reactions yet. A "pendiente" record creating a task is a
    // future addition (ROADMAP H3) and would live here.
  }

  registerAgent(): void {
    // Intentionally none: medical records are the most sensitive data in the
    // system and are NOT exposed through agent tools (they would travel to the
    // LLM provider). Revisit only with an explicit owner decision.
  }

  createControllers() {
    return [new MedicalController(this.deps.bus)];
  }

  private medicalRepository(): MedicalRepository {
    return this.deps.repositories.get(MedicalRepository);
  }

  private fileStorage(): FileStorage {
    return this.deps.repositories.get(FileStorage);
  }
}
