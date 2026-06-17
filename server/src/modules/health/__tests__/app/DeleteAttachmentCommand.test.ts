import { describe, expect, it, beforeEach } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { DeleteAttachmentCommand, DeleteAttachmentCommandHandler } from "../../app/medical/DeleteAttachmentCommand";
import { FakeFileStorage } from "../fakes/FakeFileStorage";
import { FakeMedicalRepository } from "../fakes/FakeMedicalRepository";
import {validateUpload} from "../../domain/medical/file-validation";
import {ValidationHttpError} from "../../../common/http/errors";

const PDF = Buffer.from("%PDF-1.7\nfake pdf bytes");
const userA = new UserIdentity("user-a");

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

  it("deletes a single attachment and its blob", async () => {
    const record = await createRecord();
    const attachment = await upload(record.id);

    await new DeleteAttachmentCommandHandler(repo, storage).handle(new DeleteAttachmentCommand(attachment.id), userA);

    expect(storage.blobs.size).toBe(0);
    const attachments = await repo.listAttachments(userA.userId, [record.id]);
    expect(attachments).toHaveLength(0);
  });
});
