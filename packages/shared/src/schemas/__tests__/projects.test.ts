import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createProjectSchema, updateProjectSchema } from "../projects";

describe("createProjectSchema", () => {
  it("accepts optional hourly rate data", () => {
    const clientId = randomUUID();

    expect(createProjectSchema.parse({
      kind: "work",
      outcome: "Ship report",
      nextAction: "Log hours",
      focus: "Revenue",
      clientId,
      hourlyRate: 125.5,
      rateCurrency: "USD",
    })).toMatchObject({
      hourlyRate: "125.5",
      rateCurrency: "USD",
    });
  });

  it("rejects non-positive hourly rates", () => {
    expect(() => createProjectSchema.parse({
      kind: "work",
      outcome: "Ship report",
      nextAction: "Log hours",
      focus: "Revenue",
      hourlyRate: "0",
    })).toThrow();
  });
});

describe("updateProjectSchema", () => {
  it("allows clearing the hourly rate", () => {
    expect(updateProjectSchema.parse({ hourlyRate: null, rateCurrency: "ARS" })).toEqual({
      hourlyRate: null,
      rateCurrency: "ARS",
    });
  });
});
