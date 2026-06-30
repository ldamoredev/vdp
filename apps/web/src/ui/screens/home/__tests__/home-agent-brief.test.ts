import { describe, expect, it } from "vitest";
import type { HomeViewModel } from "@/ui/models/home/HomeViewModel";
import { buildHomeAgentBrief } from "../home-agent-brief";

function baseModel(overrides: Partial<HomeViewModel> = {}): HomeViewModel {
  return {
    title: "Centro de comando",
    subtitle: "",
    onlineLabel: "En línea",
    stats: { tasksCompleted: 0, tasksTotal: 0, tasksPending: 0, tasksPct: 0, averageCompletion: 0 },
    todayTasks: { tasks: [], newTitle: "", canCreate: false, isCreating: false, createError: null },
    objectives: { href: "/objectives", countLabel: "0 activas", items: [] },
    ritual: {
      morning: {
        statusLabel: "",
        summary: "",
        projectHours: { title: "", summary: "", totalLabel: "0h", emptyLabel: "", hasEntries: false, rows: [] },
        carryOverTasks: [],
        carryOverCountLabel: "0 pendientes",
        canConfirmCarryOvers: false,
        isConfirmingCarryOvers: false,
        focusOptions: [],
        focusTaskTitle: null,
        plannedAtLabel: null,
        isSavingFocus: false,
        error: null,
      },
      statusLabel: "",
      href: "/review",
      ctaLabel: "",
      taskCount: 0,
      walletCount: 0,
      insightCount: 0,
    },
    wallet: {
      isLoading: false,
      netBalanceLabel: "$ 0",
      incomeLabel: "+$ 0",
      expensesLabel: "-$ 0",
      transactionCountLabel: "0 movimientos",
      activityLabel: "Recientes",
      recentTransactions: [],
    },
    signals: [],
    signalCountLabel: "0 recientes",
    trend: [],
    rhythm: { periodLabel: "últimos 7 días", rateLabel: "—", tone: "ok", message: "", domains: [] },
    ...overrides,
  };
}

describe("buildHomeAgentBrief", () => {
  it("leads with the chosen focus task when one is set", () => {
    const model = baseModel({
      ritual: {
        ...baseModel().ritual,
        morning: { ...baseModel().ritual.morning, focusTaskTitle: "Pagar el alquiler" },
      },
    });

    expect(buildHomeAgentBrief(model)).toContain('Foco de hoy: Pagar el alquiler.');
  });

  it("flags pending carry-overs when there is no focus yet", () => {
    const model = baseModel({
      ritual: {
        ...baseModel().ritual,
        morning: {
          ...baseModel().ritual.morning,
          carryOverTasks: [{ id: "t1", title: "x", detail: "", selected: false }],
          carryOverCountLabel: "1 pendiente",
        },
      },
    });

    expect(buildHomeAgentBrief(model)).toContain("1 pendiente de ayer");
  });

  it("includes the top signals and an in-progress objective", () => {
    const model = baseModel({
      signals: [
        {
          id: "s1",
          tone: "warning",
          typeLabel: "Alerta",
          domainLabel: "Wallet",
          title: "Gasto inusual",
          message: "",
          dateLabel: "",
          periodLabel: null,
          action: null,
        },
      ],
      objectives: {
        href: "/objectives",
        countLabel: "1 activa",
        items: [
          {
            id: "o1",
            title: "Ahorrar para el viaje",
            periodLabel: "",
            sourceLabel: "Manual",
            currentValueLabel: "30 %",
            targetValueLabel: "100 %",
            progressPercent: 30,
            progressLabel: "30%",
            isCreatingTask: false,
          },
        ],
      },
    });

    const brief = buildHomeAgentBrief(model);
    expect(brief).toContain("Alerta (Wallet): Gasto inusual.");
    expect(brief).toContain('Meta "Ahorrar para el viaje": 30 % de 100 % (30%).');
  });

  it("falls back to a light-day message when nothing stands out", () => {
    expect(buildHomeAgentBrief(baseModel())).toContain("Día liviano");
  });

  it("never mentions medical/private-record content", () => {
    const brief = buildHomeAgentBrief(baseModel());
    expect(brief.toLowerCase()).not.toMatch(/medic|salud privada|síntoma/);
  });
});
