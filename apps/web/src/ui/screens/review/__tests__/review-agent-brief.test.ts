import { describe, expect, it } from "vitest";
import type { ReviewViewModel } from "@/ui/models/review/ReviewViewModel";
import { buildReviewAgentBrief } from "../review-agent-brief";

function baseModel(overrides: Partial<ReviewViewModel> = {}): ReviewViewModel {
  return {
    dateLabel: "lunes, 15 jun",
    progressLabel: "2 de 5 bloques resueltos",
    taskQueue: [],
    projectHours: { title: "", summary: "", totalLabel: "0h", emptyLabel: "", hasEntries: false, rows: [] },
    mood: {
      selectedMood: null,
      selectedEnergy: null,
      moodOptions: [],
      energyOptions: [],
      isSaving: false,
      error: null,
      weeklyInsight: "",
      summary: "",
    },
    wallet: { signals: [], transactions: [] },
    insights: [],
    decisions: { categories: [], note: "", summary: "" },
    editSheet: { transaction: null, open: false },
    ...overrides,
  };
}

describe("buildReviewAgentBrief", () => {
  it("always leads with the close-of-day progress", () => {
    expect(buildReviewAgentBrief(baseModel())).toContain("Cierre de hoy: 2 de 5 bloques resueltos.");
  });

  it("flags undecided tasks and wallet signals", () => {
    const model = baseModel({
      taskQueue: [{ id: "t1", title: "x", detail: "", carryOverCount: 1 }],
      wallet: {
        signals: [{ id: "w1", kind: "high-amount", title: "Monto alto", body: "", transactionIds: [] }],
        transactions: [],
        summary: "1 movimiento revisable hoy.",
      },
    });

    const brief = buildReviewAgentBrief(model);
    expect(brief).toContain("1 tarea sin decidir todavía.");
    expect(brief).toContain("1 señal de wallet por revisar (1 movimiento revisable hoy.).");
  });

  it("reports the mood/energy check-in when present", () => {
    const model = baseModel({
      mood: { ...baseModel().mood, selectedMood: 4, selectedEnergy: 3 },
    });

    expect(buildReviewAgentBrief(model)).toContain("Ánimo de hoy: 4/5, energía 3/5.");
  });

  it("prompts for a missing mood check-in", () => {
    expect(buildReviewAgentBrief(baseModel())).toContain("Todavía no registraste ánimo/energía de hoy.");
  });

  it("never mentions medical/private-record content", () => {
    const brief = buildReviewAgentBrief(baseModel());
    expect(brief.toLowerCase()).not.toMatch(/medic|salud privada|síntoma/);
  });
});
