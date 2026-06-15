import { describe, expect, it } from "vitest";

import { MedicalRecord } from "../../domain/MedicalRecord";

function record(): MedicalRecord {
  return MedicalRecord.fromSnapshot({
    id: "r1",
    type: "estudio",
    title: "Análisis de sangre",
    recordDate: "2026-06-10",
    professional: "Dra. López",
    specialty: "Clínica",
    notes: null,
    createdAt: new Date("2026-06-10T08:00:00.000Z"),
    updatedAt: new Date("2026-06-10T08:00:00.000Z"),
  });
}

describe("MedicalRecord", () => {
  it("round-trips through a snapshot", () => {
    const r = record();
    expect(MedicalRecord.fromSnapshot(r.toSnapshot()).toSnapshot()).toEqual(r.toSnapshot());
  });

  it("applies a partial update and bumps updatedAt", () => {
    const r = record();
    const before = r.updatedAt;
    r.update({ type: "consulta", notes: "control anual" });
    expect(r.type).toBe("consulta");
    expect(r.notes).toBe("control anual");
    expect(r.title).toBe("Análisis de sangre"); // untouched
    expect(r.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});
