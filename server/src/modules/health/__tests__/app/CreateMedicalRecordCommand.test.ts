import { Identity } from "@nbottarini/cqbus";
import { describe, expect, it, beforeEach } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { CreateMedicalRecordCommand, CreateMedicalRecordCommandHandler } from "../../app/medical/CreateMedicalRecordCommand";
import { FakeMedicalRepository } from "../fakes/FakeMedicalRepository";

const userA = new UserIdentity("user-a");
const anonymous = {
    isAuthenticated: false,
    authenticationType: "none",
    roles: [],
    properties: {},
    name: "anonymous",
} as Identity;

describe("create medical record", () => {
    let repo: FakeMedicalRepository;

    beforeEach(() => {
        repo = new FakeMedicalRepository();
    });

    async function createRecord(identity = userA) {
        const handler = new CreateMedicalRecordCommandHandler(repo);
        return handler.handle(
            new CreateMedicalRecordCommand({ type: "estudio", title: "Análisis", recordDate: "2026-06-10" }),
            identity,
        );
    }
    it("creates a record and lists it scoped to its owner", async () => {
        const record = await createRecord(userA);

        expect(record).toMatchObject({ id: record.id, title: "Análisis", attachments: [] });
    });

    it("rejects unauthenticated access before touching private records", async () => {
        await expect(
            new CreateMedicalRecordCommandHandler(repo).handle(
                new CreateMedicalRecordCommand({ type: "consulta", title: "Control", recordDate: "2026-06-10" }),
                anonymous,
            ),
        ).rejects.toMatchObject({ statusCode: 401 });

        const list = await repo.listRecords(userA.userId);
        expect(list).toHaveLength(0);
    });
});
