import { Command, Identity, RequestHandler } from "@nbottarini/cqbus";

import { requireUserIdentity } from "../../../common/app/auth/UserIdentity";
import { FileStorage } from "../../../common/base/storage/FileStorage";
import { MedicalRepository } from "../../domain/medical/MedicalRepository";

export class DeleteAttachmentCommand extends Command<void> {
  constructor(readonly attachmentId: string) {
    super();
  }
}

export class DeleteAttachmentCommandHandler
  implements RequestHandler<DeleteAttachmentCommand, void>
{
  constructor(
    private readonly medical: MedicalRepository,
    private readonly storage: FileStorage,
  ) {}

  async handle(command: DeleteAttachmentCommand, identity: Identity): Promise<void> {
    const { userId } = requireUserIdentity(identity);
    const storageRef = await this.medical.deleteAttachment(userId, command.attachmentId);
    if (storageRef) await this.storage.delete(storageRef);
  }
}
