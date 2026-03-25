"use client";

import { useState } from "react";
import Link from "next/link";

interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly time: string;
  readonly duration: string;
  readonly type: "meeting" | "focus" | "break" | "deadline";
  readonly attendees?: readonly string[];
}

interface EmailDraft {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

const todayEvents: readonly CalendarEvent[] = [
  { id: "1", title: "Daily standup", time: "09:00", duration: "15min", type: "meeting", attendees: ["Martín", "Laura", "Nico"] },
  { id: "2", title: "Deep work — VDP Sprint", time: "09:30", duration: "2h", type: "focus" },
  { id: "3", title: "Review PR #247", time: "11:30", duration: "30min", type: "deadline" },
  { id: "4", title: "Almuerzo", time: "12:30", duration: "1h", type: "break" },
  { id: "5", title: "1:1 con Martín (CTO)", time: "14:00", duration: "30min", type: "meeting", attendees: ["Martín"] },
  { id: "6", title: "Sprint planning", time: "15:00", duration: "1h", type: "meeting", attendees: ["Equipo completo"] },
  { id: "7", title: "Investigación — Arquitectura de eventos", time: "16:30", duration: "1h30m", type: "focus" },
];

const eventTypeStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
  meeting: { bg: "var(--blue-soft-bg)", text: "var(--blue-soft-text)", border: "var(--blue-soft-border)", label: "Reunión" },
  focus: { bg: "var(--amber-soft-bg)", text: "var(--amber-soft-text)", border: "var(--amber-soft-border)", label: "Foco" },
  break: { bg: "var(--emerald-soft-bg)", text: "var(--emerald-soft-text)", border: "var(--emerald-soft-border)", label: "Descanso" },
  deadline: { bg: "var(--red-soft-bg)", text: "var(--red-soft-text)", border: "var(--red-soft-border)", label: "Deadline" },
};

const quickEmails: readonly EmailDraft[] = [
  { to: "martin@startup.io", subject: "Update sprint VDP", body: "Hola Martín,\n\nTe paso un update del sprint actual:\n\n- " },
  { to: "laura.garcia@company.com", subject: "Review PR #247", body: "Hola Laura,\n\nCuando puedas mirá el PR #247. Los cambios principales son:\n\n- " },
  { to: "equipo@company.com", subject: "Notas del daily", body: "Equipo,\n\nResumen del daily de hoy:\n\n- " },
];

export default function WorkDashboard() {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  function openEmailComposer(draft?: EmailDraft) {
    setEmailTo(draft?.to ?? "");
    setEmailSubject(draft?.subject ?? "");
    setEmailBody(draft?.body ?? "");
    setEmailOpen(true);
  }

  function sendEmail() {
    const params = new URLSearchParams();
    if (emailSubject) params.set("subject", emailSubject);
    if (emailBody) params.set("body", emailBody);
    window.open(`mailto:${emailTo}?${params.toString()}`, "_self");
    setEmailOpen(false);
  }

  function openGoogleCalendar() {
    window.open("https://calendar.google.com", "_blank");
  }

  function createCalendarEvent(event: CalendarEvent) {
    const today = new Date();
    const [h, m] = event.time.split(":").map(Number);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              background: "var(--amber-soft-bg)",
              color: "var(--amber-soft-text)",
              border: "1px solid var(--amber-soft-border)",
            }}
          >
            K
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Work</h1>
            <p className="text-sm text-[var(--muted)]">Tu carrera profesional, gestionada con intención</p>
          </div>
        </div>
        <Link href="/" className="btn-secondary text-xs px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => openEmailComposer()}
          className="glass-card group cursor-pointer p-4 flex items-center gap-3 transition-all"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--blue-soft-bg)", border: "1px solid var(--blue-soft-border)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">Nuevo email</div>
            <div className="text-[11px] text-[var(--muted)]">Componer y enviar</div>
          </div>
        </button>

        <button
          onClick={openGoogleCalendar}
          className="glass-card group cursor-pointer p-4 flex items-center gap-3 transition-all"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--emerald-soft-bg)", border: "1px solid var(--emerald-soft-border)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">Google Calendar</div>
            <div className="text-[11px] text-[var(--muted)]">Ver agenda completa</div>
          </div>
        </button>

        <button
          onClick={() => window.open("https://meet.google.com/new", "_blank")}
          className="glass-card group cursor-pointer p-4 flex items-center gap-3 transition-all"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--amber-soft-bg)", border: "1px solid var(--amber-soft-border)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11" /><rect width="14" height="12" x="2" y="6" rx="2" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-[var(--foreground)]">Nueva reunión</div>
            <div className="text-[11px] text-[var(--muted)]">Google Meet</div>
          </div>
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar — left column */}
        <div className="lg:col-span-3 glass-card-static overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-soft-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <h3 className="text-sm font-medium text-[var(--foreground)]">Agenda de hoy</h3>
            </div>
            <button
              onClick={openGoogleCalendar}
              className="text-xs cursor-pointer transition-colors"
              style={{ color: "var(--amber-soft-text)" }}
            >
              Abrir Calendar
            </button>
          </div>

          <div className="divide-y divide-[var(--divider)]">
            {todayEvents.map((event) => {
              const style = eventTypeStyles[event.type];
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-[var(--hover-overlay)] group"
                >
                  {/* Time column */}
                  <div className="w-12 shrink-0 text-right">
                    <div className="text-sm font-medium text-[var(--foreground)]">{event.time}</div>
                    <div className="text-[10px] text-[var(--muted)]">{event.duration}</div>
                  </div>

                  {/* Color bar */}
                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ background: style.text }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)] truncate">{event.title}</span>
                      <span
                        className="badge text-[10px] shrink-0"
                        style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
                      >
                        {style.label}
                      </span>
                    </div>
                    {event.attendees && (
                      <div className="text-[11px] text-[var(--muted)] mt-1">
                        👥 {event.attendees.join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Add to GCal */}
                  <button
                    onClick={() => createCalendarEvent(event)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[var(--hover-overlay-strong)]"
                    title="Agregar a Google Calendar"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column — Emails */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card-static overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <h3 className="text-sm font-medium text-[var(--foreground)]">Emails rápidos</h3>
              <button
                onClick={() => openEmailComposer()}
                className="text-xs cursor-pointer"
                style={{ color: "var(--amber-soft-text)" }}
              >
                + Nuevo
              </button>
            </div>
            <div className="divide-y divide-[var(--divider)]">
              {quickEmails.map((draft) => (
                <button
                  key={draft.subject}
                  onClick={() => openEmailComposer(draft)}
                  className="w-full text-left p-4 transition-colors hover:bg-[var(--hover-overlay)] cursor-pointer"
                >
                  <div className="text-xs text-[var(--muted)]">{draft.to}</div>
                  <div className="text-sm font-medium text-[var(--foreground)] mt-0.5">{draft.subject}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Projects mini */}
          <div className="glass-card-static overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
              <h3 className="text-sm font-medium text-[var(--foreground)]">Proyectos</h3>
              <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--muted)]">Demo</span>
            </div>
            <div className="space-y-3 p-4">
              {[
                { name: "VDP — Life OS", pct: 68, accent: true },
                { name: "Cliente Fintech", pct: 45, accent: false },
                { name: "Curso Arquitectura", pct: 20, accent: false },
              ].map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-[var(--foreground)]">{p.name}</span>
                    <span className="text-xs" style={{ color: p.accent ? "var(--amber-soft-text)" : "var(--muted)" }}>{p.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${p.pct}%`,
                        background: p.accent
                          ? "linear-gradient(90deg, var(--amber-soft-text), var(--amber-soft-border))"
                          : "var(--muted-bg)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email composer modal */}
      {emailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-backdrop" onClick={() => setEmailOpen(false)} />
          <div className="relative w-full max-w-lg glass-card-static p-6 animate-fade-in-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--foreground)]">Nuevo email</h3>
              <button
                onClick={() => setEmailOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Para</label>
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="destinatario@email.com"
                  className="glass-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Asunto</label>
                <input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Asunto del email"
                  className="glass-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted)] block mb-1">Mensaje</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Escribí tu mensaje..."
                  className="glass-input w-full p-3 text-sm resize-none"
                  rows={5}
                />
              </div>
            </div>

            <button
              onClick={sendEmail}
              disabled={!emailTo.trim()}
              className="btn-primary w-full justify-center"
            >
              Abrir en cliente de email
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--amber-soft-text)" }} />
          <span className="text-xs text-[var(--muted)]">Integraciones reales — Gmail, Google Calendar, Meet</span>
        </div>
      </div>
    </div>
  );
}
