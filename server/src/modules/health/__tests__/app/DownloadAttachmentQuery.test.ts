import {beforeEach, describe, expect, it} from "vitest";

import {UserIdentity} from "../../../common/app/auth/UserIdentity";
import {DownloadAttachmentQuery, DownloadAttachmentQueryHandler} from "../../app/medical/DownloadAttachmentQuery";
import {FakeFileStorage} from "../fakes/FakeFileStorage";
import {FakeMedicalRepository} from "../fakes/FakeMedicalRepository";
import {validateUpload} from "../../domain/medical/file-validation";
import {ValidationHttpError} from "../../../common/http/errors";
import {MedicalAttachment} from "../../domain/medical/MedicalAttachment";

const PDF = Buffer.from("%PDF-1.7\nfake pdf bytes");
const userA = new UserIdentity("user-a");
const userB = new UserIdentity("user-b");

describe("medical CQBus handlers", () => {
  let repo: FakeMedicalRepository;
  let storage: FakeFileStorage;

  beforeEach(() => {
    repo = new FakeMedicalRepository();
    storage = new FakeFileStorage();
  });

  async function createRecord(identity = userA) {
    return repo.createRecord(identity.userId, { type: "estudio", title: "Análisis", recordDate: "2026-06-10" })
  }

  async function upload(recordId: string, content = PDF, filename = "estudio.pdf", identity = userA) {
    const result = validateUpload({ filename: filename, content: PDF });
    if (!result.ok) throw new ValidationHttpError(result.reason);
    const storageRef = await storage.save(content);
    return await repo.addAttachment(identity.userId, recordId, {
      filename: filename,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      storageRef,
    });
  }

  function downloadFile(attachment: MedicalAttachment, userIdentity: UserIdentity) {
    return new DownloadAttachmentQueryHandler(repo, storage).handle(new DownloadAttachmentQuery(attachment.id), userIdentity,);
  }

  it("download file", async () => {
    const record = await createRecord();
    const attachment = await upload(record.id);

    const download = await downloadFile(attachment, userA);

    expect(download).not.toBeNull();
    expect(download!.mimeType).toBe("application/pdf");
    expect(download!.content.equals(PDF)).toBe(true);
  });


  it("does not let a user attach to, or download, another user's record", async () => {
    const record = await createRecord(userA);
    const attachment = await upload(record.id, PDF, "x.pdf", userA);

    const download = await downloadFile(attachment, userB);

    expect(download).toBeNull();
  });
});
