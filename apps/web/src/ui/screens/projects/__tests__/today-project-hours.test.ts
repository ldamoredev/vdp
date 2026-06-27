import { describe, expect, it } from "vitest";

import { ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import { buildTodayProjectHoursVM } from "../today-project-hours";

describe("buildTodayProjectHoursVM", () => {
  it("builds an empty state when today has no project time", () => {
    const vm = buildTodayProjectHoursVM(null);

    expect(vm.hasEntries).toBe(false);
    expect(vm.totalLabel).toBe("0m");
    expect(vm.summary).toBe("Todavía no cargaste horas de proyecto para hoy.");
    expect(vm.rows).toEqual([]);
  });

  it("groups rows by project, sorts by minutes, and keeps a short list", () => {
    const vm = buildTodayProjectHoursVM(ProjectHoursReport.from({
      fromDate: "2026-06-27",
      toDate: "2026-06-27",
      totalMinutes: 375,
      rows: [
        {
          clientId: null,
          clientName: null,
          projectId: "p2",
          projectOutcome: "Ops",
          weekStart: "2026-06-22",
          minutes: 60,
        },
        {
          clientId: "c1",
          clientName: "Acme",
          projectId: "p1",
          projectOutcome: "Client portal",
          weekStart: "2026-06-22",
          minutes: 150,
        },
        {
          clientId: null,
          clientName: null,
          projectId: "p3",
          projectOutcome: "Planning",
          weekStart: "2026-06-22",
          minutes: 90,
        },
        {
          clientId: null,
          clientName: null,
          projectId: "p2",
          projectOutcome: "Ops",
          weekStart: "2026-06-22",
          minutes: 45,
        },
        {
          clientId: null,
          clientName: null,
          projectId: "p4",
          projectOutcome: "Admin",
          weekStart: "2026-06-22",
          minutes: 30,
        },
      ],
    }));

    expect(vm.hasEntries).toBe(true);
    expect(vm.totalLabel).toBe("6h 15m");
    expect(vm.summary).toBe("Hoy dedicaste 6h 15m a 4 proyectos.");
    expect(vm.rows.map((row) => [row.projectOutcome, row.durationLabel])).toEqual([
      ["Client portal", "2h 30m"],
      ["Ops", "1h 45m"],
      ["Planning", "1h 30m"],
    ]);
  });
});
