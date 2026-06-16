import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { MedicalGateway } from "../../../domain/health/medical/MedicalGateway";

export class DeleteAttachment extends Command<void> {
  constructor(
    readonly recordId: string,
    readonly attachmentId: string,
  ) {
    super();
  }
}

export class DeleteAttachmentHandler implements RequestHandler<DeleteAttachment, void> {
  constructor(private readonly gateway: MedicalGateway) {}

  async handle(command: DeleteAttachment): Promise<void> {
    await this.gateway.deleteAttachment(command.recordId, command.attachmentId);
  }
}
