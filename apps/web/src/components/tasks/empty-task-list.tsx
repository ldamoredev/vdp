import { CheckCheck, MessageSquarePlus, Plus, Sparkles } from "lucide-react";

type FilterKey = "focus" | "pending" | "done" | "all";

interface EmptyTaskListProps {
  filter: FilterKey;
}

const filterMessages: Record<FilterKey, { title: string; subtitle: string }> = {
  focus: {
    title: "Sin tareas urgentes",
    subtitle: "Tu cola de foco esta limpia. Buen momento para avanzar con lo pendiente.",
  },
  pending: {
    title: "Todo al dia",
    subtitle: "No quedan pendientes para hoy. Si surge algo nuevo, podes capturarlo abajo.",
  },
  done: {
    title: "Todavia sin tareas completadas",
    subtitle: "Cuando completes tareas van a aparecer aca. Arranca con la mas simple.",
  },
  all: {
    title: "Dia libre de tareas",
    subtitle:
      "No hay tareas cargadas para esta fecha. Usa captura rapida o conversa con el asistente para planificar tu dia.",
  },
};

export function EmptyTaskList({ filter }: EmptyTaskListProps) {
  const { title, subtitle } = filterMessages[filter];

  return (
    <div className="animate-fade-in rounded-[28px] border border-dashed border-[var(--glass-border)] bg-[var(--hover-overlay)] px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--violet-soft-bg)]">
        {filter === "done" ? (
          <Sparkles size={24} style={{ color: "var(--violet-soft-text)", opacity: 0.8 }} />
        ) : (
          <CheckCheck size={24} style={{ color: "var(--violet-soft-text)", opacity: 0.8 }} />
        )}
      </div>

      <p className="mt-4 text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
        {subtitle}
      </p>

      {filter !== "done" && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1.5 text-[11px] text-[var(--muted)]">
            <Plus size={12} />
            Captura rapida
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--hover-overlay)] px-3 py-1.5 text-[11px] text-[var(--muted)]">
            <MessageSquarePlus size={12} />
            Chat
          </span>
        </div>
      )}
    </div>
  );
}
