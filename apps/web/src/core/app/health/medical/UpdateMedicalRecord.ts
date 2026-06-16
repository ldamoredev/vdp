import { Command, RequestHandler } from "@nbottarini/cqbus";

import type {
  MedicalGateway,
  MedicalRecordWithAttachments,
  UpdateMedicalRecordInput,
} from "../../../domain/health/medical/MedicalGateway";

export class UpdateMedicalRecord extends Command<MedicalRecordWithAttachments> {
  constructor(
    readonly id: string,
    readonly input: UpdateMedicalRecordInput,
  ) {
    super();
  }
}

export class UpdateMedicalRecordHandler
  implements RequestHandler<UpdateMedicalRecord, MedicalRecordWithAttachments>
{
  constructor(private readonly gateway: MedicalGateway) {}

  async handle(command: UpdateMedicalRecord): Promise<MedicalRecordWithAttachments> {
    return this.gateway.updateRecord(command.id, command.input);
  }
}
