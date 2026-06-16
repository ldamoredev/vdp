import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { MedicalGateway } from "../../../domain/health/medical/MedicalGateway";

export class DeleteMedicalRecord extends Command<void> {
  constructor(readonly id: string) {
    super();
  }
}

export class DeleteMedicalRecordHandler implements RequestHandler<DeleteMedicalRecord, void> {
  constructor(private readonly gateway: MedicalGateway) {}

  async handle(command: DeleteMedicalRecord): Promise<void> {
    await this.gateway.deleteRecord(command.id);
  }
}
