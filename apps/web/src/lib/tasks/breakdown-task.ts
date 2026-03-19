import type { Task } from "@/lib/api/types";

export type BreakdownSuggestion = {
  title: string;
  steps: string[];
};

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}

export function buildBreakdownSuggestions(task: Task): BreakdownSuggestion[] {
  const title = normalizeTitle(task.title);
  const base = title.charAt(0).toLowerCase() + title.slice(1);

  return [
    {
      title: "Aclarar salida",
      steps: [
        `Definir que significa terminar: ${base}`,
        "Anotar el entregable o resultado exacto en una frase",
      ],
    },
    {
      title: "Primer empuje",
      steps: [
        `Identificar el primer paso fisico para avanzar con: ${base}`,
        "Bloquear 25 minutos solo para ese primer paso",
      ],
    },
    {
      title: task.carryOverCount > 0 ? "Destrabar carry-over" : "Reducir friccion",
      steps: [
        task.carryOverCount > 0
          ? "Escribir por que se arrastro y que impide cerrarla"
          : "Separar la parte facil de la parte incierta",
        "Elegir una accion que deje evidencia visible de avance hoy",
      ],
    },
  ];
}

export function normalizeBreakdownStep(step: string) {
  const trimmed = step.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("- ") ? trimmed : `- ${trimmed}`;
}
