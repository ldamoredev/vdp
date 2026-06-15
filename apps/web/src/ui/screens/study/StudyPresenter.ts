import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Course, Flashcard, StudyViewModel } from "@/ui/models/study/StudyViewModel";

/**
 * Placeholder Study screen presenter. No backend yet, so it returns mocked
 * flashcards and courses. When the Study module is migrated to the Core, only
 * this presenter changes — the view (Pomodoro timer, flashcard navigation) stays.
 */
const MOCK_FLASHCARDS: readonly Flashcard[] = [
  { id: "1", topic: "System Design", front: "¿Qué es el CAP theorem?", back: "En un sistema distribuido no podés garantizar Consistencia, Disponibilidad y Tolerancia a particiones al mismo tiempo. Siempre tenés que sacrificar una de las tres." },
  { id: "2", topic: "TypeScript", front: "¿Cuál es la diferencia entre `type` e `interface`?", back: "Las interfaces soportan declaración merging y extends. Los types soportan unions, intersections y mapped types. Para objetos simples, ambos funcionan. Para tipos complejos, usá type." },
  { id: "3", topic: "PostgreSQL", front: "¿Qué es un índice parcial?", back: "Un índice que solo incluye filas que cumplen una condición WHERE. Ejemplo: CREATE INDEX idx ON orders(status) WHERE status = 'pending'. Más chico y eficiente que un índice completo." },
  { id: "4", topic: "APIs REST", front: "¿Cuándo usar PUT vs PATCH?", back: "PUT reemplaza el recurso completo (idempotente). PATCH aplica una actualización parcial. Usá PATCH cuando solo necesitás modificar algunos campos." },
  { id: "5", topic: "Kubernetes", front: "¿Qué es un Pod?", back: "La unidad más chica desplegable en K8s. Puede contener uno o más contenedores que comparten red y storage. Generalmente es 1 contenedor = 1 pod." },
  { id: "6", topic: "System Design", front: "¿Qué es event sourcing?", back: "En vez de guardar el estado actual, guardás todos los eventos que llevaron a ese estado. Permite reconstruir el estado en cualquier punto del tiempo y genera una auditoría natural." },
];

const MOCK_COURSES: readonly Course[] = [
  { name: "System Design — Fundamentals", progress: 80, totalHours: 40, completedHours: 32, lastStudied: "Hoy" },
  { name: "TypeScript Avanzado", progress: 62, totalHours: 25, completedHours: 15.5, lastStudied: "Ayer" },
  { name: "PostgreSQL Performance", progress: 45, totalHours: 20, completedHours: 9, lastStudied: "Hace 3 días" },
  { name: "Diseño de APIs REST", progress: 28, totalHours: 15, completedHours: 4.2, lastStudied: "Hace 1 semana" },
  { name: "Kubernetes Basics", progress: 12, totalHours: 30, completedHours: 3.6, lastStudied: "Hace 2 semanas" },
];

export class StudyPresenter extends PresenterBase<StudyViewModel> {
  constructor(onChange: ChangeFunc) {
    super(onChange);
  }

  protected initModel(): StudyViewModel {
    return { flashcards: MOCK_FLASHCARDS, courses: MOCK_COURSES };
  }
}
