import { describe, expect, it } from "vitest";

import { analyzeTaskDraft, buildClarifiedDescription } from "../clarify";

describe("analyzeTaskDraft", () => {
  it("does not flag an empty title", () => {
    expect(analyzeTaskDraft("   ").needsClarification).toBe(false);
  });

  it("does not flag a concrete, specific title", () => {
    const analysis = analyzeTaskDraft("Enviar presupuesto corregido al cliente");
    expect(analysis.needsClarification).toBe(false);
  });

  it("flags a too-short title", () => {
    const analysis = analyzeTaskDraft("gym");
    expect(analysis.needsClarification).toBe(true);
    expect(analysis.tooShort).toBe(true);
  });

  it("flags a generic verb start", () => {
    const analysis = analyzeTaskDraft("revisar cosas pendientes hoy");
    expect(analysis.needsClarification).toBe(true);
    expect(analysis.genericStart).toBe(true);
  });

  it("asks for the next concrete step on a generic short title", () => {
    expect(analyzeTaskDraft("organizar").needsNextStepPrompt).toBe(true);
  });
});

describe("buildClarifiedDescription", () => {
  it("returns undefined when there is nothing to add", () => {
    expect(buildClarifiedDescription("", "")).toBeUndefined();
  });

  it("formats outcome and next step", () => {
    expect(buildClarifiedDescription("entregable listo", "abrir el doc")).toBe(
      "Resultado esperado: entregable listo\nSiguiente paso: abrir el doc",
    );
  });

  it("prepends an existing description", () => {
    expect(buildClarifiedDescription("X", "", "contexto previo")).toBe(
      "contexto previo\nResultado esperado: X",
    );
  });
});
