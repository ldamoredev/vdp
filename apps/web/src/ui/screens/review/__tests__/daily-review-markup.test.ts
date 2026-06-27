import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyReviewScreen } from "../components/daily-review-screen";

const useReviewPresenterMock = vi.fn();
const emptyProjectHours = {
  title: "Tiempo de proyectos hoy",
  summary: "Todavía no cargaste horas de proyecto para hoy.",
  totalLabel: "0m",
  emptyLabel: "Sin horas registradas hoy.",
  hasEntries: false,
  rows: [],
};

vi.mock("../useReviewPresenter", () => ({
  useReviewPresenter: () => useReviewPresenterMock(),
}));

import ReviewPage from "@/ui/screens/review/ReviewScreen";

beforeEach(() => {
  globalThis.React = React;
});

describe("DailyReviewScreen", () => {
  it("renders the three ritual sections and the tomorrow decisions card", () => {
    const markup = renderToStaticMarkup(
      createElement(DailyReviewScreen, {
        dateLabel: "viernes, 10 abr",
        progressLabel: "2 de 4 bloques resueltos",
        taskSection: createElement("div", null, "Cerrar tareas"),
        projectHoursSection: createElement("div", null, "Horas de proyectos"),
        moodSection: createElement("div", null, "Animo"),
        walletSection: createElement("div", null, "Verificar wallet"),
        insightsSection: createElement("div", null, "Resolver alertas"),
        decisionsSection: createElement("div", null, "Decidir mañana"),
      }),
    );

    expect(markup).toContain("Ritual diario");
    expect(markup).toContain("Cerrar tareas");
    expect(markup).toContain("Animo");
    expect(markup).toContain("Verificar wallet");
    expect(markup).toContain("Resolver alertas");
    expect(markup).toContain("Decidir mañana");
    expect(markup).toContain("sm:flex-row sm:items-start sm:justify-between");
  });
});

describe("review page", () => {
  it("renders the ritual screen from the presenter view model", () => {
    useReviewPresenterMock.mockReturnValue({
      model: {
        dateLabel: "viernes, 10 abr",
        progressLabel: "1 de 4 bloques resueltos",
        taskQueue: [],
        projectHours: emptyProjectHours,
        mood: {
          selectedMood: null,
          selectedEnergy: null,
          moodOptions: [],
          energyOptions: [],
          isSaving: false,
          error: null,
          weeklyInsight: "Sin dato",
          summary: "Sin registros",
        },
        wallet: { signals: [], transactions: [], summary: undefined },
        insights: [],
        decisions: { categories: [], note: "", summary: "Sin señal" },
        editSheet: { transaction: null, open: false },
      },
      completeTask: vi.fn(),
      carryOverTask: vi.fn(),
      discardTask: vi.fn(),
      isTaskBusy: () => false,
      acknowledgeSignal: vi.fn(),
      acknowledgeInsight: vi.fn(),
      toggleWatchedCategory: vi.fn(),
      setNote: vi.fn(),
      saveMoodCheckIn: vi.fn(),
      openEdit: vi.fn(),
      closeEdit: vi.fn(),
    });

    const markup = renderToStaticMarkup(createElement(ReviewPage));
    expect(markup).toContain("Ritual diario");
  });
});
