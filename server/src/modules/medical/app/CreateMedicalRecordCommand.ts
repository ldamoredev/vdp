import { Command, Identity, RequestHandler } from "@nbottarini/cqbus";
import type { MedicalRecordWithAttachments } from "@vdp/shared";

import { UserIdentity } from "../../common/app/auth/UserIdentity";
import { CreateMedicalRecordData } from "../domain/MedicalRecord";
import { MedicalRepository } from "../domain/MedicalRepository";
import { toRecordResponse } from "./serialize";

export class CreateMedicalRecordCommand extends Command<MedicalRecordWithAttachments> {
  constructor(readonly input: CreateMedicalRecordData) {
    super();
  }
}

export class CreateMedicalRecordCommandHandler
  implements RequestHandler<CreateMedicalRecordCommand, MedicalRecordWithAttachments>
{
  constructor(private readonly medical: MedicalRepository) {}

  async handle(command: CreateMedicalRecordCommand, identity: Identity): Promise<MedicalRecordWithAttachments> {
    const { userId } = identity as UserIdentity;
    const record = await this.medical.createRecord(userId, command.input);
    return toRecordResponse(record, []);
  }
}
