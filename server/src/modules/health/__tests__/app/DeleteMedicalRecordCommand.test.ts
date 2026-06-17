import { describe, expect, it, beforeEach } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { DeleteMedicalRecordCommand, DeleteMedicalRecordCommandHandler } from "../../app/medical/DeleteMedicalRecordCommand";
import { FakeFileStorage } from "../fakes/FakeFileStorage";
import { FakeMedicalRepository } from "../fakes/FakeMedicalRepository";
import {validateUpload} from "../../domain/medical/file-validation";
import {ValidationHttpError} from "../../../common/http/errors";
import {MedicalRecord} from "../../domain/medical/MedicalRecord";

const PDF = Buffer.from("%PDF-1.7\nfake pdf bytes");
const userA = new UserIdentity("user-a");

describe("delete medical record", () => {
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

  function deleteMedicalRecord(record: MedicalRecord) {
    return new DeleteMedicalRecordCommandHandler(repo, storage).handle(new DeleteMedicalRecordCommand(record.id), userA,);
  }

  it("deletes a record and cleans up its attachment blobs", async () => {
    const record = await createRecord();
    await upload(record.id);
    expect(storage.blobs.size).toBe(1);

    await deleteMedicalRecord(record);

    const list = await repo.listRecords(userA.userId);
    expect(list).toHaveLength(0);
    expect(storage.blobs.size).toBe(0); // blob cleaned up
  });
});
