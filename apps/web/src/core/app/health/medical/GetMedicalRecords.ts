import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { MedicalGateway, MedicalRecordWithAttachments } from "../../../domain/health/medical/MedicalGateway";

export class GetMedicalRecords extends Query<MedicalRecordWithAttachments[]> {}

export class GetMedicalRecordsHandler
  implements RequestHandler<GetMedicalRecords, MedicalRecordWithAttachments[]>
{
  constructor(private readonly gateway: MedicalGateway) {}

  async handle(): Promise<MedicalRecordWithAttachments[]> {
    return this.gateway.getRecords();
  }
}
