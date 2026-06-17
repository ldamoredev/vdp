import { Identity } from "@nbottarini/cqbus";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { UpdateMedicalRecordCommand, UpdateMedicalRecordCommandHandler } from "../../app/medical/UpdateMedicalRecordCommand";
import { FakeMedicalRepository } from "../fakes/FakeMedicalRepository";

const userA = new UserIdentity("user-a");
const userB = new UserIdentity("user-b");
const anonymous = {
  isAuthenticated: false,
  authenticationType: "none",
  roles: [],
  properties: {},
  name: "anonymous",
} as Identity;

describe("update medical record", () => {
  let repo: FakeMedicalRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T10:00:00Z"));
    repo = new FakeMedicalRepository();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function createRecord(identity = userA) {
    return repo.createRecord(identity.userId, {
      type: "consulta",
      title: "Control clínico",
      recordDate: "2026-06-10",
      professional: "Dra. Vega",
      specialty: "Clínica",
      notes: "Control anual.",
    });
  }

  function updateRecord(recordId: string, identity: Identity = userA) {
    return new UpdateMedicalRecordCommandHandler(repo).handle(
      new UpdateMedicalRecordCommand(recordId, {
        type: "estudio",
        title: "Laboratorio completo",
        recordDate: "2026-06-17",
        professional: null,
        specialty: "Bioquímica",
        notes: "Hemograma y glucemia.",
      }),
      identity,
    );
  }

  it("updates record fields and returns its attachments", async () => {
    const record = await createRecord();
    await repo.addAttachment(userA.userId, record.id, {
      filename: "laboratorio.pdf",
      mimeType: "application/pdf",
      sizeBytes: 128,
      storageRef: "medical/laboratorio.pdf",
    });
    vi.setSystemTime(new Date("2026-06-17T12:00:00Z"));

    const updated = await updateRecord(record.id);

    expect(updated).toMatchObject({
      id: record.id,
      type: "estudio",
      title: "Laboratorio completo",
      recordDate: "2026-06-17",
      professional: null,
      specialty: "Bioquímica",
      notes: "Hemograma y glucemia.",
      updatedAt: "2026-06-17T12:00:00.000Z",
      attachments: [
        {
          recordId: record.id,
          filename: "laboratorio.pdf",
          mimeType: "application/pdf",
          sizeBytes: 128,
        },
      ],
    });
  });

  it("does not update another user's record", async () => {
    const record = await createRecord(userA);

    await expect(updateRecord(record.id, userB)).rejects.toMatchObject({ statusCode: 404 });

    const saved = await repo.getRecord(userA.userId, record.id);
    expect(saved?.toSnapshot()).toMatchObject({
      title: "Control clínico",
      recordDate: "2026-06-10",
      professional: "Dra. Vega",
      specialty: "Clínica",
      notes: "Control anual.",
    });
  });

  it("rejects unauthenticated access before touching private records", async () => {
    const record = await createRecord();

    await expect(updateRecord(record.id, anonymous)).rejects.toMatchObject({ statusCode: 401 });

    const saved = await repo.getRecord(userA.userId, record.id);
    expect(saved?.title).toBe("Control clínico");
  });
});
