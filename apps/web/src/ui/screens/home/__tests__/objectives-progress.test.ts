import { describe, expect, it } from "vitest";

import { formatDaysRemaining, objectiveCreateTaskHref } from "../objectives-progress";

describe("formatDaysRemaining", () => {
  it("returns 'Termina hoy' when periodEnd equals today", () => {
    expect(formatDaysRemaining("2026-06-15", "2026-06-15")).toBe("Termina hoy");
  });

  it("returns 'Queda 1 día' the day before the deadline", () => {
    expect(formatDaysRemaining("2026-06-16", "2026-06-15")).toBe("Queda 1 día");
  });

  it("returns 'Quedan N días' when more than one day remains", () => {
    expect(formatDaysRemaining("2026-06-17", "2026-06-15")).toBe("Quedan 2 días");
    expect(formatDaysRemaining("2026-07-15", "2026-06-15")).toBe("Quedan 30 días");
  });

  it("returns 'Vencida hace N día(s)' when the deadline already passed", () => {
    expect(formatDaysRemaining("2026-06-14", "2026-06-15")).toBe("Vencida hace 1 día");
    expect(formatDaysRemaining("2026-05-15", "2026-06-15")).toBe("Vencida hace 31 días");
  });
});

describe("objectiveCreateTaskHref", () => {
  it("builds a /tasks?capturar= deep-link with an 'Avanzar en:' prefix and URL-encoded title", () => {
    expect(objectiveCreateTaskHref("Leer 12 libros")).toBe(
      `/tasks?capturar=${encodeURIComponent("Avanzar en: Leer 12 libros")}`,
    );
  });

  it("URL-encodes characters that are unsafe in a query string", () => {
    expect(objectiveCreateTaskHref("Ahorrar para el viaje & más")).toContain(
      encodeURIComponent("Avanzar en: Ahorrar para el viaje & más"),
    );
  });
});