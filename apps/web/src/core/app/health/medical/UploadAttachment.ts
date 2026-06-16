import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { MedicalAttachment, MedicalGateway } from "../../../domain/health/medical/MedicalGateway";

export class UploadAttachment extends Command<MedicalAttachment> {
  constructor(
    readonly recordId: string,
    readonly file: File,
  ) {
    super();
  }
}

export class UploadAttachmentHandler implements RequestHandler<UploadAttachment, MedicalAttachment> {
  constructor(private readonly gateway: MedicalGateway) {}

  async handle(command: UploadAttachment): Promise<MedicalAttachment> {
    return this.gateway.uploadAttachment(command.recordId, command.file);
  }
}
