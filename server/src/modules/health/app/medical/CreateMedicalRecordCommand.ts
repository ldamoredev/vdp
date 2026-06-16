import { Command, Identity, RequestHandler } from "@nbottarini/cqbus";
import type { MedicalRecordWithAttachments } from "@vdp/shared";

import { requireUserIdentity } from "../../../common/app/auth/UserIdentity";
import { CreateMedicalRecordData } from "../../domain/medical/MedicalRecord";
import { MedicalRepository } from "../../domain/medical/MedicalRepository";
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
    const { userId } = requireUserIdentity(identity);
    const record = await this.medical.createRecord(userId, command.input);
    return toRecordResponse(record, []);
  }
}
