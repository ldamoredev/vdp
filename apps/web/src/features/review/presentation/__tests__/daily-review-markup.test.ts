import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DailyReviewScreen } from "../components/daily-review-screen";

const useDailyReviewModelMock = vi.fn();

vi.mock("../use-daily-review-model", () => ({
  useDailyReviewModel: () => useDailyReviewModelMock(),
}));

import ReviewPage from "../../../../app/(domain)/review/page";

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
        walletSection: createElement("div", null, "Verificar wallet"),
        insightsSection: createElement("div", null, "Resolver alertas"),
        decisionsSection: createElement("div", null, "Decidir mañana"),
      }),
    );

    expect(markup).toContain("Ritual diario");
    expect(markup).toContain("Cerrar tareas");
    expect(markup).toContain("Verificar wallet");
    expect(markup).toContain("Resolver alertas");
    expect(markup).toContain("Decidir mañana");
  });
});

describe("review page", () => {
  it("renders the ritual screen using the review model", () => {
    useDailyReviewModelMock.mockReturnValue({
      dateLabel: "viernes, 10 abr",
      progressLabel: "1 de 4 bloques resueltos",
      screenProps: {
        dateLabel: "viernes, 10 abr",
        progressLabel: "1 de 4 bloques resueltos",
        taskSection: createElement("div", null, "Cerrar tareas"),
        walletSection: createElement("div", null, "Verificar wallet"),
        insightsSection: createElement("div", null, "Resolver alertas"),
        decisionsSection: createElement("div", null, "Decidir mañana"),
      },
      editSheetProps: {
        transaction: null,
        open: false,
        onClose: vi.fn(),
      },
    });

    const markup = renderToStaticMarkup(createElement(ReviewPage));
    expect(markup).toContain("Ritual diario");
  });
});
