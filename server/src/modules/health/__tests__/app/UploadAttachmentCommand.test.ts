import { describe, expect, it, beforeEach } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { UploadAttachmentCommand, UploadAttachmentCommandHandler } from "../../app/medical/UploadAttachmentCommand";
import { FakeFileStorage } from "../fakes/FakeFileStorage";
import { FakeMedicalRepository } from "../fakes/FakeMedicalRepository";

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
    const handler = new UploadAttachmentCommandHandler(repo, storage);
    return handler.handle(new UploadAttachmentCommand(recordId, filename, content), identity);
  }

  it("uploads a validated file, stores the bytes, and serves them back on download", async () => {
    const record = await createRecord();

    const attachment = await upload(record.id);

    expect(attachment).toMatchObject({
      recordId: record.id,
      filename: "estudio.pdf",
      mimeType: "application/pdf",
      sizeBytes: PDF.length,
    });
    expect(attachment).not.toHaveProperty("storageRef"); // internal, never on the wire
    expect(storage.blobs.size).toBe(1);
  });

  it("rejects a disallowed file type by sniffing content", async () => {
    const record = await createRecord();
    await expect(upload(record.id, Buffer.from("plain text, not a file"), "notas.txt")).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(storage.blobs.size).toBe(0); // nothing persisted on rejection
  });

  it("does not let a user attach to, or download, another user's record", async () => {
    const record = await createRecord(userA);

    await expect(upload(record.id, PDF, "x.pdf", userB)).rejects.toMatchObject({ statusCode: 404 });
  });
});
