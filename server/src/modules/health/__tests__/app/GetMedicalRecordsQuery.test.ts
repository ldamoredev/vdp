import { Identity } from "@nbottarini/cqbus";
import { describe, expect, it, beforeEach } from "vitest";

import { UserIdentity } from "../../../common/app/auth/UserIdentity";
import { GetMedicalRecordsQuery, GetMedicalRecordsQueryHandler } from "../../app/medical/GetMedicalRecordsQuery";
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

describe("get medical records", () => {
    let repo: FakeMedicalRepository;

    beforeEach(() => {
        repo = new FakeMedicalRepository();
    });

    async function createRecord(identity = userA) {
       return repo.createRecord(identity.userId, { type: "estudio", title: "Análisis", recordDate: "2026-06-10" })
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

        const list = await new GetMedicalRecordsQueryHandler(repo).handle(new GetMedicalRecordsQuery(), userA);
        expect(list.records).toHaveLength(0);
    });
});
