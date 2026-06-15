import { Command, Identity, RequestHandler } from "@nbottarini/cqbus";
import type { MedicalAttachment as WireAttachment } from "@vdp/shared";

import { UserIdentity } from "../../common/app/auth/UserIdentity";
import { FileStorage } from "../../common/base/storage/FileStorage";
import { NotFoundHttpError, ValidationHttpError } from "../../common/http/errors";
import { validateUpload } from "../domain/file-validation";
import { MedicalRepository } from "../domain/MedicalRepository";
import { toAttachmentResponse } from "./serialize";

export class UploadAttachmentCommand extends Command<WireAttachment> {
  constructor(
    readonly recordId: string,
    readonly filename: string,
    readonly content: Buffer,
  ) {
    super();
  }
}

export class UploadAttachmentCommandHandler
  implements RequestHandler<UploadAttachmentCommand, WireAttachment>
{
  constructor(
    private readonly medical: MedicalRepository,
    private readonly storage: FileStorage,
  ) {}

  async handle(command: UploadAttachmentCommand, identity: Identity): Promise<WireAttachment> {
    const { userId } = identity as UserIdentity;

    // Ownership first: you can only attach to your own record.
    const record = await this.medical.getRecord(userId, command.recordId);
    if (!record) throw new NotFoundHttpError("Registro médico no encontrado.");

    // Validate by sniffing the real content type — never trust the client header.
    const result = validateUpload({ filename: command.filename, content: command.content });
    if (!result.ok) throw new ValidationHttpError(result.reason);

    // Persist bytes through the storage seam, then the metadata row.
    const storageRef = await this.storage.save(command.content);
    const attachment = await this.medical.addAttachment(userId, command.recordId, {
      filename: result.filename,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      storageRef,
    });
    return toAttachmentResponse(attachment);
  }
}
