import { describe, expect, it, vi } from "vitest";

import { Core } from "../../../../Core";
import { HealthModule } from "../../HealthModule";
import { CreateMedicalRecord } from "../CreateMedicalRecord";
import { DeleteAttachment } from "../DeleteAttachment";
import { DeleteMedicalRecord } from "../DeleteMedicalRecord";
import { GetMedicalRecords } from "../GetMedicalRecords";
import { UpdateMedicalRecord } from "../UpdateMedicalRecord";
import { UploadAttachment } from "../UploadAttachment";
import { FakeMedicalGateway } from "./fakes/FakeMedicalGateway";

function coreWith(gateway: FakeMedicalGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new HealthModule(undefined, gateway));
}

describe("health medical handlers (dispatched through the bus)", () => {
  it("GetMedicalRecords reads the medical archive", async () => {
    const gateway = new FakeMedicalGateway();
    gateway.records = [
      {
        id: "rec-1",
        type: "estudio",
        title: "Laboratorio",
        recordDate: "2026-06-10",
        professional: null,
        specialty: null,
        notes: null,
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z",
        attachments: [],
      },
    ];

    const result = await coreWith(gateway).execute(new GetMedicalRecords());

    expect(gateway.callsTo("getRecords")).toHaveLength(1);
    expect(result[0].title).toBe("Laboratorio");
  });

  it("CreateMedicalRecord forwards the input", async () => {
    const gateway = new FakeMedicalGateway();
    await coreWith(gateway).execute(
      new CreateMedicalRecord({ type: "consulta", title: "Control", recordDate: "2026-06-10" }),
    );

    expect(gateway.callsTo("createRecord")[0].args).toEqual([
      { type: "consulta", title: "Control", recordDate: "2026-06-10" },
    ]);
  });

  it("UpdateMedicalRecord forwards id and patch", async () => {
    const gateway = new FakeMedicalGateway();
    await coreWith(gateway).execute(new UpdateMedicalRecord("rec-1", { notes: "Traer resultados" }));

    expect(gateway.callsTo("updateRecord")[0].args).toEqual(["rec-1", { notes: "Traer resultados" }]);
  });

  it("DeleteMedicalRecord forwards the id", async () => {
    const gateway = new FakeMedicalGateway();
    await coreWith(gateway).execute(new DeleteMedicalRecord("rec-1"));

    expect(gateway.callsTo("deleteRecord")[0].args).toEqual(["rec-1"]);
  });

  it("UploadAttachment forwards record id and file", async () => {
    const gateway = new FakeMedicalGateway();
    const file = new File(["%PDF"], "estudio.pdf", { type: "application/pdf" });

    await coreWith(gateway).execute(new UploadAttachment("rec-1", file));

    expect(gateway.callsTo("uploadAttachment")[0].args).toEqual(["rec-1", file]);
  });

  it("DeleteAttachment forwards record id and attachment id", async () => {
    const gateway = new FakeMedicalGateway();
    await coreWith(gateway).execute(new DeleteAttachment("rec-1", "att-1"));

    expect(gateway.callsTo("deleteAttachment")[0].args).toEqual(["rec-1", "att-1"]);
  });
});
