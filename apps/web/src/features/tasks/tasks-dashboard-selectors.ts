import type { Task, TaskNote } from "@/lib/api/types";

export type TaskFilter = "focus" | "pending" | "done" | "all";
export type PlanningTone = "success" | "info" | "warning" | "error";

export const taskDomainOptions = [
  { value: "", label: "Sin dominio" },
  { value: "wallet", label: "Finanzas" },
  { value: "health", label: "Salud" },
  { value: "work", label: "Trabajo" },
  { value: "people", label: "Gente" },
  { value: "study", label: "Estudio" },
];

export function sortExecutionQueue(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "pending" ? -1 : 1;
    }

    if (left.carryOverCount !== right.carryOverCount) {
      return right.carryOverCount - left.carryOverCount;
    }

    if (left.priority !== right.priority) {
      return right.priority - left.priority;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function getFilterTasks(tasks: Task[], filter: TaskFilter) {
  if (filter === "pending") return tasks.filter((task) => task.status === "pending");
  if (filter === "done") return tasks.filter((task) => task.status === "done");
  if (filter === "focus") {
    return tasks.filter(
      (task) =>
        task.status === "pending" &&
        (task.priority >= 2 || task.carryOverCount > 0),
    );
  }

  return tasks;
}

export function getTaskTone(task: Task) {
  if (task.status === "done") {
    return "border-[var(--emerald-soft-border)] bg-[var(--emerald-soft-bg)]";
  }

  if (task.carryOverCount >= 3) {
    return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)]";
  }

  if (task.carryOverCount > 0 || task.priority === 3) {
    return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)]";
  }

  return "border-[var(--glass-border)] bg-[var(--hover-overlay)]";
}

export function getPlanningToneClasses(tone: PlanningTone) {
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

export function formatTaskDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function noteTypeLabel(type: TaskNote["type"]) {
  if (type === "breakdown_step") return "Paso";
  if (type === "blocker") return "Bloqueo";
  return "Nota";
}

export function noteTypeTone(type: TaskNote["type"]) {
  if (type === "breakdown_step") {
    return "border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] text-[var(--violet-soft-text)]";
  }

  if (type === "blocker") {
    return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]";
  }

  return "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--foreground)]";
}

export function buildPlanningSignals(args: {
  pendingTasks: Task[];
  urgentTasks: Task[];
  stuckTasks: Task[];
  carryOverRate?: number;
}) {
  const { pendingTasks, urgentTasks, stuckTasks, carryOverRate = 0 } = args;
  const focusTasks = pendingTasks
    .filter((task) => task.priority >= 2 || task.carryOverCount > 0)
    .slice(0, 3);

  const tone: PlanningTone =
    stuckTasks.length > 0 || carryOverRate >= 50 || pendingTasks.length >= 8
      ? "error"
      : urgentTasks.length >= 4 || carryOverRate >= 35 || pendingTasks.length >= 5
        ? "warning"
        : pendingTasks.length === 0
          ? "success"
          : "info";

  const headline =
    tone === "error"
      ? "Plan cargado al limite"
      : tone === "warning"
        ? "Plan con presion"
        : tone === "success"
          ? "Plan liviano"
          : "Plan controlable";

  const summary =
    tone === "error"
      ? "Conviene bajar la carga antes de seguir agregando tareas. El arrastre ya esta afectando la ejecucion."
      : tone === "warning"
        ? "Todavia es recuperable, pero necesitas elegir mejor que entra en foco y que no."
        : tone === "success"
          ? "La carga de hoy es baja. Puedes ejecutar sin entrar en modo reactivo."
          : "Hay trabajo real, pero la cola aun puede sostenerse si respetas el foco.";

  const recommendations = [
    pendingTasks.length === 0
      ? "No agregues volumen artificial. Usa el chat o captura rapida solo si aparece trabajo concreto."
      : `Limita el foco a ${Math.max(1, Math.min(3, focusTasks.length || 3))} tarea${focusTasks.length === 1 ? "" : "s"} de impacto inmediato.`,
    carryOverRate >= 35
      ? `El carry-over de 7 dias va en ${carryOverRate}%. Prioriza cierre o descarte antes de seguir moviendo tareas.`
      : "El arrastre semanal esta bajo control. Mantener el foco hoy vale mas que replanificar de mas.",
    stuckTasks.length > 0
      ? `${stuckTasks.length} tarea${stuckTasks.length === 1 ? "" : "s"} ya estan bloqueadas por carry-over. Necesitan decision explicita, no mas espera.`
      : urgentTasks.length > 0
        ? `${urgentTasks.length} tarea${urgentTasks.length === 1 ? "" : "s"} caliente${urgentTasks.length === 1 ? "" : "s"} merecen resolucion antes del resto.`
        : "No hay señales fuertes de atasco. Puedes sostener el plan si evitas abrir demasiados frentes.",
  ];

  return {
    tone,
    headline,
    summary,
    recommendations,
    focusTasks,
  };
}
