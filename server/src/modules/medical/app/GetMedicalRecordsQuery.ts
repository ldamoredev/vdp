import { Identity, Query, RequestHandler } from "@nbottarini/cqbus";
import type { MedicalRecordsResponse } from "@vdp/shared";

import { UserIdentity } from "../../common/app/auth/UserIdentity";
import { MedicalRepository } from "../domain/MedicalRepository";
import { toRecordResponse } from "./serialize";

export class GetMedicalRecordsQuery extends Query<MedicalRecordsResponse> {}

export class GetMedicalRecordsQueryHandler
  implements RequestHandler<GetMedicalRecordsQuery, MedicalRecordsResponse>
{
  constructor(private readonly medical: MedicalRepository) {}

  async handle(_query: GetMedicalRecordsQuery, identity: Identity): Promise<MedicalRecordsResponse> {
    const { userId } = identity as UserIdentity;
    const records = await this.medical.listRecords(userId);
    const attachments = await this.medical.listAttachments(
      userId,
      records.map((record) => record.id),
    );
    const byRecord = new Map<string, typeof attachments>();
    for (const attachment of attachments) {
      const list = byRecord.get(attachment.recordId) ?? [];
      list.push(attachment);
      byRecord.set(attachment.recordId, list);
    }
    return {
      records: records.map((record) => toRecordResponse(record, byRecord.get(record.id) ?? [])),
    };
  }
}
