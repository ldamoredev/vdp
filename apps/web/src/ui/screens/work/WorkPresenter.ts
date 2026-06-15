import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type {
  CalendarEvent,
  EmailDraft,
  WorkProject,
  WorkViewModel,
} from "@/ui/models/work/WorkViewModel";

/**
 * Placeholder Work screen presenter. No backend yet, so it returns mocked
 * agenda, quick emails and projects. When the Work module is migrated to the
 * Core, only this presenter changes — the view (email composer, calendar
 * actions) stays.
 */
const MOCK_EVENTS: readonly CalendarEvent[] = [
  { id: "1", title: "Daily standup", time: "09:00", duration: "15min", type: "meeting", attendees: ["Martín", "Laura", "Nico"] },
  { id: "2", title: "Deep work — VDP Sprint", time: "09:30", duration: "2h", type: "focus" },
  { id: "3", title: "Review PR #247", time: "11:30", duration: "30min", type: "deadline" },
  { id: "4", title: "Almuerzo", time: "12:30", duration: "1h", type: "break" },
  { id: "5", title: "1:1 con Martín (CTO)", time: "14:00", duration: "30min", type: "meeting", attendees: ["Martín"] },
  { id: "6", title: "Sprint planning", time: "15:00", duration: "1h", type: "meeting", attendees: ["Equipo completo"] },
  { id: "7", title: "Investigación — Arquitectura de eventos", time: "16:30", duration: "1h30m", type: "focus" },
];

const MOCK_QUICK_EMAILS: readonly EmailDraft[] = [
  { to: "martin@startup.io", subject: "Update sprint VDP", body: "Hola Martín,\n\nTe paso un update del sprint actual:\n\n- " },
  { to: "laura.garcia@company.com", subject: "Review PR #247", body: "Hola Laura,\n\nCuando puedas mirá el PR #247. Los cambios principales son:\n\n- " },
  { to: "equipo@company.com", subject: "Notas del daily", body: "Equipo,\n\nResumen del daily de hoy:\n\n- " },
];

const MOCK_PROJECTS: readonly WorkProject[] = [
  { name: "VDP — Life OS", pct: 68, accent: true },
  { name: "Cliente Fintech", pct: 45, accent: false },
  { name: "Curso Arquitectura", pct: 20, accent: false },
];

export class WorkPresenter extends PresenterBase<WorkViewModel> {
  constructor(onChange: ChangeFunc) {
    super(onChange);
  }

  protected initModel(): WorkViewModel {
    return { events: MOCK_EVENTS, quickEmails: MOCK_QUICK_EMAILS, projects: MOCK_PROJECTS };
  }
}
