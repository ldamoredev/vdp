import { describe, expect, it } from "vitest";

import { createObjectiveSchema, updateObjectiveSchema } from "../objectives";

describe("createObjectiveSchema", () => {
  it("accepts manual metric bindings and normalizes numeric values", () => {
    expect(createObjectiveSchema.parse({
      title: "Leer 12 libros",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      metricSource: "manual",
      target: "12",
      unit: "libros",
      manualValue: "2",
    })).toMatchObject({
      target: 12,
      manualValue: 2,
    });
  });

  it("accepts projects hours bindings with nullable manual value", () => {
    expect(createObjectiveSchema.parse({
      title: "120 horas facturables",
      periodStart: "2026-07-01",
      periodEnd: "2026-09-30",
      metricSource: "projects_hours",
      target: 120,
      unit: "h",
      manualValue: null,
    })).toMatchObject({
      metricSource: "projects_hours",
      manualValue: null,
    });
  });

  it("rejects invalid periods and non-positive targets", () => {
    expect(() => createObjectiveSchema.parse({
      title: "Rango roto",
      periodStart: "2026-10-01",
      periodEnd: "2026-09-30",
      metricSource: "manual",
      target: 10,
      unit: "puntos",
    })).toThrow();

    expect(() => createObjectiveSchema.parse({
      title: "Target roto",
      periodStart: "2026-07-01",
      periodEnd: "2026-09-30",
      metricSource: "manual",
      target: 0,
      unit: "puntos",
    })).toThrow();
  });
});

describe("updateObjectiveSchema", () => {
  it("allows partial updates including manual progress", () => {
    expect(updateObjectiveSchema.parse({ manualValue: 7 })).toEqual({ manualValue: 7 });
  });

  it("rejects partial period updates", () => {
    expect(() => updateObjectiveSchema.parse({ periodStart: "2026-10-01" })).toThrow();
    expect(() => updateObjectiveSchema.parse({ periodEnd: "2026-09-30" })).toThrow();
  });
});
