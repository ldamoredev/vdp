import type { HomeViewModel } from "@/ui/models/home/HomeViewModel";

/**
 * Forward-looking brief for the chat panel's opening message on /home (R3a).
 * Pure composition over the already-built HomeViewModel — no new queries.
 */
export function buildHomeAgentBrief(model: HomeViewModel): string {
  const lines: string[] = [];
  const morning = model.ritual.morning;

  if (morning.focusTaskTitle) {
    lines.push(`Foco de hoy: ${morning.focusTaskTitle}.`);
  } else if (morning.carryOverTasks.length > 0) {
    lines.push(`Tenés ${morning.carryOverCountLabel} de ayer sin confirmar todavía.`);
  } else if (model.todayTasks.tasks.length > 0) {
    lines.push(`Hoy tenés ${model.stats.tasksPending} tarea${model.stats.tasksPending === 1 ? "" : "s"} pendiente${model.stats.tasksPending === 1 ? "" : "s"}.`);
  }

  for (const signal of model.signals.slice(0, 2)) {
    lines.push(`${signal.typeLabel} (${signal.domainLabel}): ${signal.title}.`);
  }

  const objective = model.objectives.items.find((item) => item.progressPercent < 100);
  if (objective) {
    lines.push(`Meta "${objective.title}": ${objective.currentValueLabel} de ${objective.targetValueLabel} (${objective.progressLabel}).`);
  }

  const watchCounts: string[] = [];
  if (model.ritual.walletCount > 0) {
    watchCounts.push(`${model.ritual.walletCount} señal${model.ritual.walletCount === 1 ? "" : "es"} de wallet`);
  }
  if (model.ritual.insightCount > 0) {
    watchCounts.push(`${model.ritual.insightCount} insight${model.ritual.insightCount === 1 ? "" : "s"} sin leer`);
  }
  if (watchCounts.length > 0) {
    lines.push(`Para mirar: ${watchCounts.join(" y ")}.`);
  }

  if (lines.length === 0) {
    return "Día liviano: sin tareas, señales ni arrastres pendientes. ¿En qué te ayudo?";
  }

  return lines.join(" ");
}
