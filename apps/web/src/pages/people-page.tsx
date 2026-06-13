"use client";

import { useState } from "react";
import Link from "next/link";

interface Contact {
  readonly id: string;
  readonly name: string;
  readonly circle: "familia" | "amigos" | "trabajo";
  readonly phone: string;
  readonly telegram?: string;
  readonly email: string;
  readonly birthday: string;
  readonly lastContact: string;
  readonly avatar: string;
  readonly notes: string;
}

const contacts: readonly Contact[] = [
  {
    id: "1",
    name: "Mamá",
    circle: "familia",
    phone: "+5491100000001",
    telegram: "mama_tg",
    email: "mama@email.com",
    birthday: "28 Mar",
    lastContact: "Ayer",
    avatar: "M",
    notes: "Preguntarle por el turno del lunes",
  },
  {
    id: "2",
    name: "Nico",
    circle: "amigos",
    phone: "+5491100000002",
    telegram: "nico_dev",
    email: "nico@email.com",
    birthday: "03 Abr",
    lastContact: "Hace 3 días",
    avatar: "N",
    notes: "Me debe el libro de system design",
  },
  {
    id: "3",
    name: "Laura García",
    circle: "trabajo",
    phone: "+5491100000003",
    email: "laura.garcia@company.com",
    birthday: "15 Abr",
    lastContact: "Hace 1 semana",
    avatar: "L",
    notes: "Coordinamos la review del sprint el viernes",
  },
  {
    id: "4",
    name: "Papá",
    circle: "familia",
    phone: "+5491100000004",
    telegram: "papa_tg",
    email: "papa@email.com",
    birthday: "22 Abr",
    lastContact: "Hace 2 días",
    avatar: "P",
    notes: "Arreglar el wifi del depto cuando vaya",
  },
  {
    id: "5",
    name: "Cami",
    circle: "familia",
    phone: "+5491100000005",
    email: "cami@email.com",
    birthday: "01 May",
    lastContact: "Hace 2 semanas",
    avatar: "C",
    notes: "Cumple pronto — pensar regalo",
  },
  {
    id: "6",
    name: "Martín CTO",
    circle: "trabajo",
    phone: "+5491100000006",
    telegram: "martin_cto",
    email: "martin@startup.io",
    birthday: "12 Jun",
    lastContact: "Hoy",
    avatar: "MT",
    notes: "Hablamos sobre la propuesta de arquitectura",
  },
];

const circleColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  familia: {
    bg: "var(--purple-soft-bg)",
    text: "var(--purple-soft-text)",
    border: "var(--purple-soft-border)",
    label: "Familia",
  },
  amigos: {
    bg: "var(--blue-soft-bg)",
    text: "var(--blue-soft-text)",
    border: "var(--blue-soft-border)",
    label: "Amigos",
  },
  trabajo: {
    bg: "var(--amber-soft-bg)",
    text: "var(--amber-soft-text)",
    border: "var(--amber-soft-border)",
    label: "Trabajo",
  },
};

type FilterCircle = "todos" | "familia" | "amigos" | "trabajo";

export default function PeopleDashboard() {
  const [filter, setFilter] = useState<FilterCircle>("todos");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerChannel, setComposerChannel] = useState<"whatsapp" | "telegram">("whatsapp");
  const [messageText, setMessageText] = useState("");

  const filtered = filter === "todos" ? contacts : contacts.filter((c) => c.circle === filter);

  function openComposer(contact: Contact, channel: "whatsapp" | "telegram") {
    setSelected(contact);
    setComposerChannel(channel);
    setMessageText("");
    setComposerOpen(true);
  }

  function sendMessage() {
    if (!selected) return;
    const encoded = encodeURIComponent(messageText);
    if (composerChannel === "whatsapp") {
      window.open(`https://wa.me/${selected.phone.replace(/\+/g, "")}?text=${encoded}`, "_blank");
    } else if (composerChannel === "telegram" && selected.telegram) {
      window.open(`https://t.me/${selected.telegram}`, "_blank");
    }
    setComposerOpen(false);
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              background: "var(--purple-soft-bg)",
              color: "var(--purple-soft-text)",
              border: "1px solid var(--purple-soft-border)",
            }}
          >
            P
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">People</h1>
            <p className="text-sm text-[var(--muted)]">Cuidá tus relaciones, no pierdas el hilo de nadie</p>
          </div>
        </div>
        <Link href="/" className="btn-secondary text-xs px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Circle filters */}
      <div className="flex gap-2 flex-wrap">
        {(["todos", "familia", "amigos", "trabajo"] as const).map((key) => {
          const isActive = filter === key;
          const circle = key !== "todos" ? circleColors[key] : null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="badge cursor-pointer transition-all"
              style={{
                background: isActive ? (circle?.bg ?? "var(--active-overlay)") : "var(--muted-bg)",
                color: isActive ? (circle?.text ?? "var(--foreground)") : "var(--foreground-muted)",
                border: `1px solid ${isActive ? (circle?.border ?? "var(--glass-border-hover)") : "var(--divider)"}`,
                padding: "6px 14px",
                fontSize: "13px",
              }}
            >
              {key === "todos" ? "Todos" : circle?.label}
            </button>
          );
        })}
      </div>

      {/* Contact cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {filtered.map((contact) => {
          const circle = circleColors[contact.circle];
          return (
            <div key={contact.id} className="glass-card-static p-5 space-y-4">
              {/* Contact header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: circle.bg, color: circle.text, border: `1px solid ${circle.border}` }}
                >
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate">{contact.name}</span>
                    <span
                      className="badge text-[10px]"
                      style={{ background: circle.bg, color: circle.text, border: `1px solid ${circle.border}` }}
                    >
                      {circle.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-[var(--muted)]">🎂 {contact.birthday}</span>
                    <span className="text-[11px] text-[var(--muted)]">💬 {contact.lastContact}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl bg-[var(--hover-overlay)] p-3 text-xs text-[var(--foreground-muted)] leading-relaxed">
                📝 {contact.notes}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => openComposer(contact, "whatsapp")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: "rgba(37, 211, 102, 0.12)",
                    color: "#25D366",
                    border: "1px solid rgba(37, 211, 102, 0.25)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </button>

                {contact.telegram && (
                  <button
                    onClick={() => openComposer(contact, "telegram")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-[1.02]"
                    style={{
                      background: "rgba(0, 136, 204, 0.12)",
                      color: "#0088CC",
                      border: "1px solid rgba(0, 136, 204, 0.25)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Telegram
                  </button>
                )}

                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: "var(--muted-bg)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--divider)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message composer modal */}
      {composerOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-backdrop" onClick={() => setComposerOpen(false)} />
          <div className="relative w-full max-w-md glass-card-static p-6 animate-fade-in-up space-y-4">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: composerChannel === "whatsapp" ? "rgba(37, 211, 102, 0.15)" : "rgba(0, 136, 204, 0.15)",
                    color: composerChannel === "whatsapp" ? "#25D366" : "#0088CC",
                  }}
                >
                  {selected.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{selected.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    via {composerChannel === "whatsapp" ? "WhatsApp" : "Telegram"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setComposerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Quick replies */}
            <div className="flex gap-2 flex-wrap">
              {["Hola! Como andas?", "Te escribo por...", "Podemos hablar?"].map((text) => (
                <button
                  key={text}
                  onClick={() => setMessageText(text)}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: "var(--hover-overlay)",
                    color: "var(--foreground-muted)",
                    border: "1px solid var(--divider)",
                  }}
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Message input */}
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribí tu mensaje..."
              className="glass-input w-full p-3 text-sm resize-none"
              rows={3}
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={!messageText.trim()}
              className="btn-primary w-full justify-center"
              style={{
                background: composerChannel === "whatsapp"
                  ? "linear-gradient(135deg, #25D366, #128C7E)"
                  : "linear-gradient(135deg, #0088CC, #005F8C)",
              }}
            >
              Enviar por {composerChannel === "whatsapp" ? "WhatsApp" : "Telegram"}
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
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--purple-soft-text)" }} />
          <span className="text-xs text-[var(--muted)]">Mensajería real — se abre WhatsApp o Telegram</span>
        </div>
      </div>
    </div>
  );
}
