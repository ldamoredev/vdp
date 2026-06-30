import type { ReviewViewModel } from "@/ui/models/review/ReviewViewModel";

/**
 * Backward-looking brief for the chat panel's opening message on /review (R3a).
 * Pure composition over the already-built ReviewViewModel — no new queries.
 */
export function buildReviewAgentBrief(model: ReviewViewModel): string {
  const lines: string[] = [`Cierre de hoy: ${model.progressLabel}.`];

  if (model.taskQueue.length > 0) {
    lines.push(`${model.taskQueue.length} tarea${model.taskQueue.length === 1 ? "" : "s"} sin decidir todavía.`);
  }

  if (model.wallet.signals.length > 0) {
    lines.push(`${model.wallet.signals.length} señal${model.wallet.signals.length === 1 ? "" : "es"} de wallet por revisar${model.wallet.summary ? ` (${model.wallet.summary})` : ""}.`);
  } else if (model.wallet.summary) {
    lines.push(model.wallet.summary);
  }

  if (model.insights.length > 0) {
    lines.push(`${model.insights.length} insight${model.insights.length === 1 ? "" : "s"} sin leer.`);
  }

  if (model.mood.selectedMood !== null) {
    lines.push(`Ánimo de hoy: ${model.mood.selectedMood}/5, energía ${model.mood.selectedEnergy ?? "sin dato"}/5.`);
  } else {
    lines.push("Todavía no registraste ánimo/energía de hoy.");
  }

  return lines.join(" ");
}
