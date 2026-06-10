export type TaskClarification = {
  needsClarification: boolean;
  reasons: string[];
  prompts: string[];
  examples: string[];
};

const GENERIC_STARTERS = [
  "hacer",
  "ver",
  "revisar",
  "resolver",
  "organizar",
  "arreglar",
  "trabajar",
  "planear",
  "pensar",
  "pendiente",
  "tema",
  "cosas",
  "stuff",
  "misc",
];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function analyzeTaskDraft(title: string): TaskClarification {
  const normalized = normalize(title);
  const words = normalized.split(/\s+/).filter(Boolean);
  const reasons: string[] = [];
  const prompts: string[] = [];

  if (!normalized) {
    return {
      needsClarification: false,
      reasons: [],
      prompts: [],
      examples: [],
    };
  }

  if (words.length < 2 || normalized.length < 12) {
    reasons.push("El titulo es demasiado corto para saber que accion concreta implica.");
  }

  const startsGeneric = GENERIC_STARTERS.some((starter) =>
    normalized.startsWith(`${starter} `) || normalized === starter,
  );

  if (startsGeneric) {
    reasons.push("La accion arranca con un verbo o etiqueta demasiado generica.");
  }

  if (words.length <= 3 && !/\b(a|para|con|de)\b/.test(normalized)) {
    prompts.push("Que tiene que quedar resuelto cuando esta tarea termine?");
  }

  if (startsGeneric || words.length <= 2) {
    prompts.push("Cual es el siguiente paso concreto que la vuelve ejecutable?");
  }

  if (reasons.length === 0 && prompts.length === 0) {
    return {
      needsClarification: false,
      reasons: [],
      prompts: [],
      examples: [],
    };
  }

  return {
    needsClarification: true,
    reasons,
    prompts:
      prompts.length > 0
        ? prompts
        : [
            "Que resultado concreto esperas?",
            "Cual es el siguiente paso visible?",
          ],
    examples: [
      "Llamar a Juan para definir fecha de entrega",
      "Enviar presupuesto corregido al cliente",
      "Revisar resumen de estudio y definir 3 puntos clave",
    ],
  };
}

export function buildClarifiedDescription(
  outcome: string,
  nextStep: string,
  currentDescription?: string,
) {
  const sections = [
    currentDescription?.trim(),
    outcome.trim() ? `Resultado esperado: ${outcome.trim()}` : undefined,
    nextStep.trim() ? `Siguiente paso: ${nextStep.trim()}` : undefined,
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n") : undefined;
}
