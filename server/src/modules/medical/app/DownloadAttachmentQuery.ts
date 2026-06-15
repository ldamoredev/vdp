import { Identity, Query, RequestHandler } from "@nbottarini/cqbus";

import { UserIdentity } from "../../common/app/auth/UserIdentity";
import { FileStorage } from "../../common/base/storage/FileStorage";
import { MedicalRepository } from "../domain/MedicalRepository";

export type AttachmentDownload = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  content: Buffer;
};

export class DownloadAttachmentQuery extends Query<AttachmentDownload | null> {
  constructor(readonly attachmentId: string) {
    super();
  }
}

export class DownloadAttachmentQueryHandler
  implements RequestHandler<DownloadAttachmentQuery, AttachmentDownload | null>
{
  constructor(
    private readonly medical: MedicalRepository,
    private readonly storage: FileStorage,
  ) {}

  async handle(query: DownloadAttachmentQuery, identity: Identity): Promise<AttachmentDownload | null> {
    const { userId } = identity as UserIdentity;
    // Authorize on the metadata row (owner-scoped) before touching the bytes.
    const attachment = await this.medical.getAttachment(userId, query.attachmentId);
    if (!attachment) return null;
    const content = await this.storage.read(attachment.storageRef);
    if (!content) return null;
    return {
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      content,
    };
  }
}
