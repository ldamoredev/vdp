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

/**
 * Example titles shown in the clarification gate. Content, not UI chrome, but
 * Spanish-facing; the presenter surfaces them. Kept here next to the heuristic
 * so the canonical "what a clear task looks like" lives in one place.
 */
export const CLARIFICATION_EXAMPLES = [
  "Llamar a Juan para definir fecha de entrega",
  "Enviar presupuesto corregido al cliente",
  "Revisar resumen de estudio y definir 3 puntos clave",
];

/**
 * Heuristic analysis of a task title to decide whether it is too vague to be
 * actionable. Pure and presentation-free: returns booleans only — the presenter
 * maps them to the Spanish reasons/prompts shown in the clarification gate.
 */
export interface TaskDraftAnalysis {
  needsClarification: boolean;
  /** Title too short to tell what concrete action it implies. */
  tooShort: boolean;
  /** Starts with a too-generic verb/label. */
  genericStart: boolean;
  /** Worth asking what "done" means (short, no linking preposition). */
  needsOutcomePrompt: boolean;
  /** Worth asking for the next concrete step (generic or very short). */
  needsNextStepPrompt: boolean;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function analyzeTaskDraft(title: string): TaskDraftAnalysis {
  const normalized = normalize(title);
  const empty: TaskDraftAnalysis = {
    needsClarification: false,
    tooShort: false,
    genericStart: false,
    needsOutcomePrompt: false,
    needsNextStepPrompt: false,
  };

  if (!normalized) return empty;

  const words = normalized.split(/\s+/).filter(Boolean);
  const tooShort = words.length < 2 || normalized.length < 12;
  const genericStart = GENERIC_STARTERS.some(
    (starter) => normalized.startsWith(`${starter} `) || normalized === starter,
  );
  const needsOutcomePrompt = words.length <= 3 && !/\b(a|para|con|de)\b/.test(normalized);
  const needsNextStepPrompt = genericStart || words.length <= 2;

  const needsClarification = tooShort || genericStart || needsOutcomePrompt || needsNextStepPrompt;
  if (!needsClarification) return empty;

  return { needsClarification, tooShort, genericStart, needsOutcomePrompt, needsNextStepPrompt };
}

/**
 * Builds the task description persisted from a clarification (the canonical
 * "Resultado esperado / Siguiente paso" format the backend stores). Returns
 * undefined when there is nothing to add.
 */
export function buildClarifiedDescription(
  outcome: string,
  nextStep: string,
  currentDescription?: string,
): string | undefined {
  const sections = [
    currentDescription?.trim(),
    outcome.trim() ? `Resultado esperado: ${outcome.trim()}` : undefined,
    nextStep.trim() ? `Siguiente paso: ${nextStep.trim()}` : undefined,
  ].filter(Boolean);

  return sections.length > 0 ? sections.join("\n") : undefined;
}
