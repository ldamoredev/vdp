import { Command, Identity, RequestHandler } from "@nbottarini/cqbus";
import type { MedicalRecordWithAttachments } from "@vdp/shared";

import { UserIdentity } from "../../common/app/auth/UserIdentity";
import { NotFoundHttpError } from "../../common/http/errors";
import { UpdateMedicalRecordData } from "../domain/MedicalRecord";
import { MedicalRepository } from "../domain/MedicalRepository";
import { toRecordResponse } from "./serialize";

export class UpdateMedicalRecordCommand extends Command<MedicalRecordWithAttachments> {
  constructor(
    readonly id: string,
    readonly input: UpdateMedicalRecordData,
  ) {
    super();
  }
}

export class UpdateMedicalRecordCommandHandler
  implements RequestHandler<UpdateMedicalRecordCommand, MedicalRecordWithAttachments>
{
  constructor(private readonly medical: MedicalRepository) {}

  async handle(command: UpdateMedicalRecordCommand, identity: Identity): Promise<MedicalRecordWithAttachments> {
    const { userId } = identity as UserIdentity;
    const record = await this.medical.getRecord(userId, command.id);
    if (!record) throw new NotFoundHttpError("Registro médico no encontrado.");
    record.update(command.input);
    const saved = await this.medical.saveRecord(userId, record);
    const attachments = await this.medical.listAttachments(userId, [saved.id]);
    return toRecordResponse(saved, attachments);
  }
}
