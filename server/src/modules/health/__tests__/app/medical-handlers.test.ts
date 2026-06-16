import { Identity } from "@nbottarini/cqbus";
import { describe, expect, it, beforeEach } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { CreateMedicalRecordCommand, CreateMedicalRecordCommandHandler } from "../../app/medical/CreateMedicalRecordCommand";
import { DeleteAttachmentCommand, DeleteAttachmentCommandHandler } from "../../app/medical/DeleteAttachmentCommand";
import { DeleteMedicalRecordCommand, DeleteMedicalRecordCommandHandler } from "../../app/medical/DeleteMedicalRecordCommand";
import { DownloadAttachmentQuery, DownloadAttachmentQueryHandler } from "../../app/medical/DownloadAttachmentQuery";
import { GetMedicalRecordsQuery, GetMedicalRecordsQueryHandler } from "../../app/medical/GetMedicalRecordsQuery";
import { UploadAttachmentCommand, UploadAttachmentCommandHandler } from "../../app/medical/UploadAttachmentCommand";
import { FakeFileStorage } from "../fakes/FakeFileStorage";
import { FakeMedicalRepository } from "../fakes/FakeMedicalRepository";

const PDF = Buffer.from("%PDF-1.7\nfake pdf bytes");
const userA = new UserIdentity("user-a");
const userB = new UserIdentity("user-b");
const anonymous = {
  isAuthenticated: false,
  authenticationType: "none",
  roles: [],
  properties: {},
  name: "anonymous",
} as Identity;

describe("medical CQBus handlers", () => {
  let repo: FakeMedicalRepository;
  let storage: FakeFileStorage;

  beforeEach(() => {
    repo = new FakeMedicalRepository();
    storage = new FakeFileStorage();
  });

  async function createRecord(identity = userA) {
    const handler = new CreateMedicalRecordCommandHandler(repo);
    return handler.handle(
      new CreateMedicalRecordCommand({ type: "estudio", title: "Análisis", recordDate: "2026-06-10" }),
      identity,
    );
  }

  async function upload(recordId: string, content = PDF, filename = "estudio.pdf", identity = userA) {
    const handler = new UploadAttachmentCommandHandler(repo, storage);
    return handler.handle(new UploadAttachmentCommand(recordId, filename, content), identity);
  }

  it("creates a record and lists it scoped to its owner", async () => {
    const record = await createRecord(userA);

    const listA = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userA);
    const listB = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userB);

    expect(listA.records).toHaveLength(1);
    expect(listA.records[0]).toMatchObject({ id: record.id, title: "Análisis", attachments: [] });
    expect(listB.records).toHaveLength(0); // isolation
  });

  it("rejects unauthenticated access before touching private records", async () => {
    await expect(
      new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), anonymous),
    ).rejects.toMatchObject({ statusCode: 401 });
    await expect(
      new CreateMedicalRecordCommandHandler(repo).handle(
        new CreateMedicalRecordCommand({ type: "consulta", title: "Control", recordDate: "2026-06-10" }),
        anonymous,
      ),
    ).rejects.toMatchObject({ statusCode: 401 });

    const list = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userA);
    expect(list.records).toHaveLength(0);
  });

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

    const list = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userA);
    expect(list.records[0].attachments).toHaveLength(1);

    const download = await new DownloadAttachmentQueryHandler(repo, storage).handle(
      new DownloadAttachmentQuery(attachment.id),
      userA,
    );
    expect(download).not.toBeNull();
    expect(download!.mimeType).toBe("application/pdf");
    expect(download!.content.equals(PDF)).toBe(true);
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
    // userB cannot upload to userA's record
    await expect(upload(record.id, PDF, "x.pdf", userB)).rejects.toMatchObject({ statusCode: 404 });

    const attachment = await upload(record.id, PDF, "x.pdf", userA);
    // userB cannot download userA's attachment
    const download = await new DownloadAttachmentQueryHandler(repo, storage).handle(
      new DownloadAttachmentQuery(attachment.id),
      userB,
    );
    expect(download).toBeNull();
  });

  it("deletes a record and cleans up its attachment blobs", async () => {
    const record = await createRecord();
    await upload(record.id);
    expect(storage.blobs.size).toBe(1);

    await new DeleteMedicalRecordCommandHandler(repo, storage).handle(
      new DeleteMedicalRecordCommand(record.id),
      userA,
    );

    const list = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userA);
    expect(list.records).toHaveLength(0);
    expect(storage.blobs.size).toBe(0); // blob cleaned up
  });

  it("deletes a single attachment and its blob", async () => {
    const record = await createRecord();
    const attachment = await upload(record.id);

    await new DeleteAttachmentCommandHandler(repo, storage).handle(
      new DeleteAttachmentCommand(attachment.id),
      userA,
    );

    expect(storage.blobs.size).toBe(0);
    const list = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userA);
    expect(list.records[0].attachments).toHaveLength(0);
  });
});
