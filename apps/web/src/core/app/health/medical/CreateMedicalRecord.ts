import { Command, RequestHandler } from "@nbottarini/cqbus";

import type {
  CreateMedicalRecordInput,
  MedicalGateway,
  MedicalRecordWithAttachments,
} from "../../../domain/health/medical/MedicalGateway";

export class CreateMedicalRecord extends Command<MedicalRecordWithAttachments> {
  constructor(readonly input: CreateMedicalRecordInput) {
    super();
  }
}

export class CreateMedicalRecordHandler
  implements RequestHandler<CreateMedicalRecord, MedicalRecordWithAttachments>
{
  constructor(private readonly gateway: MedicalGateway) {}

  async handle(command: CreateMedicalRecord): Promise<MedicalRecordWithAttachments> {
    return this.gateway.createRecord(command.input);
  }
}
