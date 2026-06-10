import type { Task } from "@/lib/api/types";

export type ReviewSignalTone = "success" | "info" | "warning" | "error";

export type ReviewSignal = {
  title: string;
  detail: string;
  tone: ReviewSignalTone;
};

export function getReviewSignals(review: {
  pending: number;
  completionRate: number;
  pendingTasks: Task[];
}): ReviewSignal[] {
  const stuckTasks = review.pendingTasks.filter((task) => task.carryOverCount >= 3);
  const overloaded = review.pending >= 5 || review.completionRate < 50;

  if (review.pending === 0) {
    return [
      {
        title: "Cierre limpio",
        detail: "No quedan decisiones pendientes para este dia.",
        tone: "success",
      },
    ];
  }

  return [
    overloaded
      ? {
          title: "Dia sobrecargado",
          detail:
            "Conviene reprogramar solo lo rescatable y descartar el resto antes de arrastrarlo.",
          tone: "warning" as const,
        }
      : {
          title: "Cierre recuperable",
          detail:
            "El dia no esta cerrado, pero la deuda es manejable si decides ahora que sigue.",
          tone: "info" as const,
        },
    stuckTasks.length > 0
      ? {
          title: "Hay tareas bloqueadas",
          detail: `${stuckTasks.length} tarea${stuckTasks.length === 1 ? "" : "s"} arrastran demasiado carry-over y necesitan resolucion explicita.`,
          tone: "error" as const,
        }
      : {
          title: "Sin bloqueo cronico",
          detail:
            "Las pendientes aun pueden moverse sin consolidar un patron de atasco.",
          tone: "success" as const,
        },
  ];
}

export function getSignalToneClasses(tone: ReviewSignalTone) {
  if (tone === "success") {
    return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
  }

  if (tone === "warning") {
    return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
  }

  if (tone === "error") {
    return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
  }

  return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)]";
}
