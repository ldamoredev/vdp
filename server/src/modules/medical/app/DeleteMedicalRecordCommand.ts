import { Command, Identity, RequestHandler } from "@nbottarini/cqbus";

import { UserIdentity } from "../../common/app/auth/UserIdentity";
import { FileStorage } from "../../common/base/storage/FileStorage";
import { MedicalRepository } from "../domain/MedicalRepository";

export class DeleteMedicalRecordCommand extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteMedicalRecordCommandHandler
  implements RequestHandler<DeleteMedicalRecordCommand, void>
{
  constructor(
    private readonly medical: MedicalRepository,
    private readonly storage: FileStorage,
  ) {}

  async handle(command: DeleteMedicalRecordCommand, identity: Identity): Promise<void> {
    const { userId } = identity as UserIdentity;
    // Deleting the record cascades its attachment rows; the blobs live outside
    // that FK, so clean them up explicitly with the refs the delete returns.
    const storageRefs = await this.medical.deleteRecord(userId, command.id);
    await Promise.all(storageRefs.map((ref) => this.storage.delete(ref)));
  }
}
