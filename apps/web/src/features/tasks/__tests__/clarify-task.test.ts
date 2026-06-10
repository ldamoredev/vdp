import { describe, it, expect } from "vitest";
import { analyzeTaskDraft, buildClarifiedDescription } from "../clarify-task";

describe("analyzeTaskDraft", () => {
  it("does not flag an empty title", () => {
    const result = analyzeTaskDraft("   ");
    expect(result.needsClarification).toBe(false);
    expect(result.reasons).toEqual([]);
    expect(result.prompts).toEqual([]);
  });

  it("does not flag a concrete, actionable title", () => {
    const result = analyzeTaskDraft("Enviar presupuesto corregido al cliente");
    expect(result.needsClarification).toBe(false);
    expect(result.prompts).toEqual([]);
    expect(result.examples).toEqual([]);
  });

  it("flags a single generic verb and suggests a next step", () => {
    const result = analyzeTaskDraft("revisar");
    expect(result.needsClarification).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.prompts.length).toBeGreaterThan(0);
    expect(result.examples.length).toBeGreaterThan(0);
  });

  it("flags a title that is too short to be actionable", () => {
    const result = analyzeTaskDraft("pagar");
    expect(result.needsClarification).toBe(true);
    expect(result.reasons.some((reason) => reason.includes("corto"))).toBe(true);
  });

  it("flags a generic starter even within a longer phrase", () => {
    const result = analyzeTaskDraft("hacer cosas");
    expect(result.needsClarification).toBe(true);
    expect(result.reasons.some((reason) => reason.includes("generica"))).toBe(true);
  });

  it("ignores accents and casing when matching generic starters", () => {
    const lower = analyzeTaskDraft("revisar");
    const upper = analyzeTaskDraft("REVISAR");
    expect(upper.needsClarification).toBe(lower.needsClarification);
  });
});

describe("buildClarifiedDescription", () => {
  it("combines outcome and next step", () => {
    expect(
      buildClarifiedDescription("Informe entregado", "Escribir la introduccion"),
    ).toBe("Resultado esperado: Informe entregado\nSiguiente paso: Escribir la introduccion");
  });

  it("prepends the existing description when present", () => {
    expect(
      buildClarifiedDescription("Listo", "", "Contexto previo"),
    ).toBe("Contexto previo\nResultado esperado: Listo");
  });

  it("returns only the provided section", () => {
    expect(buildClarifiedDescription("", "Llamar al banco")).toBe(
      "Siguiente paso: Llamar al banco",
    );
  });

  it("returns undefined when nothing is provided", () => {
    expect(buildClarifiedDescription("  ", "  ")).toBeUndefined();
  });

  it("trims whitespace around each section", () => {
    expect(buildClarifiedDescription("  Hecho  ", "  Paso  ")).toBe(
      "Resultado esperado: Hecho\nSiguiente paso: Paso",
    );
  });
});
