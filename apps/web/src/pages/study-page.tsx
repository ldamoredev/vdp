"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ── Flashcard data ── */
interface Flashcard {
  readonly id: string;
  readonly topic: string;
  readonly front: string;
  readonly back: string;
}

const flashcards: readonly Flashcard[] = [
  { id: "1", topic: "System Design", front: "¿Qué es el CAP theorem?", back: "En un sistema distribuido no podés garantizar Consistencia, Disponibilidad y Tolerancia a particiones al mismo tiempo. Siempre tenés que sacrificar una de las tres." },
  { id: "2", topic: "TypeScript", front: "¿Cuál es la diferencia entre `type` e `interface`?", back: "Las interfaces soportan declaración merging y extends. Los types soportan unions, intersections y mapped types. Para objetos simples, ambos funcionan. Para tipos complejos, usá type." },
  { id: "3", topic: "PostgreSQL", front: "¿Qué es un índice parcial?", back: "Un índice que solo incluye filas que cumplen una condición WHERE. Ejemplo: CREATE INDEX idx ON orders(status) WHERE status = 'pending'. Más chico y eficiente que un índice completo." },
  { id: "4", topic: "APIs REST", front: "¿Cuándo usar PUT vs PATCH?", back: "PUT reemplaza el recurso completo (idempotente). PATCH aplica una actualización parcial. Usá PATCH cuando solo necesitás modificar algunos campos." },
  { id: "5", topic: "Kubernetes", front: "¿Qué es un Pod?", back: "La unidad más chica desplegable en K8s. Puede contener uno o más contenedores que comparten red y storage. Generalmente es 1 contenedor = 1 pod." },
  { id: "6", topic: "System Design", front: "¿Qué es event sourcing?", back: "En vez de guardar el estado actual, guardás todos los eventos que llevaron a ese estado. Permite reconstruir el estado en cualquier punto del tiempo y genera una auditoría natural." },
];

/* ── Course data ── */
interface Course {
  readonly name: string;
  readonly progress: number;
  readonly totalHours: number;
  readonly completedHours: number;
  readonly lastStudied: string;
}

const courses: readonly Course[] = [
  { name: "System Design — Fundamentals", progress: 80, totalHours: 40, completedHours: 32, lastStudied: "Hoy" },
  { name: "TypeScript Avanzado", progress: 62, totalHours: 25, completedHours: 15.5, lastStudied: "Ayer" },
  { name: "PostgreSQL Performance", progress: 45, totalHours: 20, completedHours: 9, lastStudied: "Hace 3 días" },
  { name: "Diseño de APIs REST", progress: 28, totalHours: 15, completedHours: 4.2, lastStudied: "Hace 1 semana" },
  { name: "Kubernetes Basics", progress: 12, totalHours: 30, completedHours: 3.6, lastStudied: "Hace 2 semanas" },
];

/* ── Pomodoro states ── */
type PomodoroPhase = "idle" | "focus" | "break";
const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function StudyDashboard() {
  /* Pomodoro */
  const [phase, setPhase] = useState<PomodoroPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  useEffect(() => {
    if (phase === "idle") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === "focus") {
            setPomodoroCount((c) => c + 1);
            setPhase("break");
            return BREAK_MINUTES * 60;
          }
          setPhase("idle");
          return FOCUS_MINUTES * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const startPomodoro = useCallback(() => {
    setPhase("focus");
    setSecondsLeft(FOCUS_MINUTES * 60);
  }, []);

  const stopPomodoro = useCallback(() => {
    setPhase("idle");
    setSecondsLeft(FOCUS_MINUTES * 60);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = phase === "focus" ? FOCUS_MINUTES * 60 : BREAK_MINUTES * 60;
  const progressPct = phase === "idle" ? 0 : ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  /* Flashcards */
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const currentCard = flashcards[cardIndex];

  function nextCard() {
    setFlipped(false);
    setCardIndex((i) => (i + 1) % flashcards.length);
  }

  function prevCard() {
    setFlipped(false);
    setCardIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  }

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              background: "var(--rose-soft-bg)",
              color: "var(--rose-soft-text)",
              border: "1px solid var(--rose-soft-border)",
            }}
          >
            S
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">Study</h1>
            <p className="text-sm text-[var(--muted)]">Aprendé con propósito, no pierdas el rumbo</p>
          </div>
        </div>
        <Link href="/" className="btn-secondary text-xs px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Dashboard
        </Link>
      </div>

      {/* Top row — Pomodoro + Flashcards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pomodoro Timer */}
        <div className="glass-card-static p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Pomodoro Timer</h3>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    background: i < pomodoroCount
                      ? "var(--rose-soft-text)"
                      : "var(--muted-bg)",
                    border: `1px solid ${i < pomodoroCount ? "var(--rose-soft-border)" : "var(--divider)"}`,
                  }}
                />
              ))}
              <span className="text-[10px] text-[var(--muted)] ml-1">{pomodoroCount}/4</span>
            </div>
          </div>

          {/* Timer display */}
          <div className="flex flex-col items-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Progress ring */}
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="72" fill="none" stroke="var(--muted-bg)" strokeWidth="6" />
                <circle
                  cx="80" cy="80" r="72"
                  fill="none"
                  stroke={phase === "break" ? "var(--emerald-soft-text)" : "var(--rose-soft-text)"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 72}`}
                  strokeDashoffset={`${2 * Math.PI * 72 * (1 - progressPct / 100)}`}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-bold tracking-tight text-[var(--foreground)] tabular-nums">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </div>
                <div className="text-xs font-medium mt-1" style={{
                  color: phase === "idle" ? "var(--muted)" : phase === "focus" ? "var(--rose-soft-text)" : "var(--emerald-soft-text)",
                }}>
                  {phase === "idle" ? "Listo para empezar" : phase === "focus" ? "Enfocado" : "Descanso"}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {phase === "idle" ? (
              <button onClick={startPomodoro} className="btn-primary px-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Iniciar sesión
              </button>
            ) : (
              <button
                onClick={stopPomodoro}
                className="btn-secondary px-6"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="4" height="14" x="6" y="5" /><rect width="4" height="14" x="14" y="5" />
                </svg>
                Detener
              </button>
            )}
          </div>
        </div>

        {/* Flashcards */}
        <div className="glass-card-static p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Flashcards</h3>
            <span className="text-xs text-[var(--muted)]">{cardIndex + 1} / {flashcards.length}</span>
          </div>

          {/* Card */}
          <button
            onClick={() => setFlipped(!flipped)}
            className="w-full min-h-[180px] rounded-xl p-5 text-left cursor-pointer transition-all hover:scale-[1.01]"
            style={{
              background: flipped ? "var(--rose-soft-bg)" : "var(--hover-overlay)",
              border: `1px solid ${flipped ? "var(--rose-soft-border)" : "var(--glass-border)"}`,
            }}
          >
            <div
              className="badge text-[10px] mb-3"
              style={{
                background: "var(--rose-soft-bg)",
                color: "var(--rose-soft-text)",
                border: "1px solid var(--rose-soft-border)",
              }}
            >
              {currentCard.topic}
            </div>
            <p className={`text-sm leading-relaxed ${flipped ? "text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
              {flipped ? currentCard.back : currentCard.front}
            </p>
            <div className="mt-4 text-[10px] text-[var(--muted)]">
              {flipped ? "Tocá para ver la pregunta" : "Tocá para ver la respuesta"}
            </div>
          </button>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevCard}
              className="btn-secondary text-xs px-3 py-2 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
              </svg>
              Anterior
            </button>
            <div className="flex gap-1">
              {flashcards.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i === cardIndex ? "var(--rose-soft-text)" : "var(--muted-bg)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={nextCard}
              className="btn-secondary text-xs px-3 py-2 cursor-pointer"
            >
              Siguiente
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Courses progress */}
      <div className="glass-card-static overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)]">Progreso de cursos</h3>
          <span className="text-xs text-[var(--muted)]">
            {courses.reduce((acc, c) => acc + c.completedHours, 0).toFixed(1)}h estudiadas
          </span>
        </div>
        <div className="divide-y divide-[var(--divider)]">
          {courses.map((course) => (
            <div key={course.name} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">{course.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[var(--muted)]">{course.lastStudied}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: course.progress >= 60 ? "var(--rose-soft-text)" : "var(--muted)" }}
                  >
                    {course.progress}%
                  </span>
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${course.progress}%`,
                    background: course.progress >= 60
                      ? "linear-gradient(90deg, var(--rose-soft-text), var(--rose-soft-border))"
                      : "var(--muted-bg)",
                  }}
                />
              </div>
              <div className="text-[11px] text-[var(--muted)]">
                {course.completedHours}h / {course.totalHours}h
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] backdrop-blur-xl">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--rose-soft-text)" }} />
          <span className="text-xs text-[var(--muted)]">Timer funcional — Flashcards interactivas</span>
        </div>
      </div>
    </div>
  );
}
