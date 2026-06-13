import { useEffect, useState } from "react";
import { Check, Flag, Plus, Sparkles, X } from "lucide-react";
import { useHealthData, useHealthActions } from "../use-health-context";
import { goalDeadlineLabel, goalUrgency, type GoalUrgency } from "../health-selectors";

function urgencyClassName(urgency: GoalUrgency) {
  switch (urgency) {
    case "overdue":
      return "border-[var(--red-soft-border)] bg-[var(--red-soft-bg)] text-[var(--red-soft-text)]";
    case "soon":
      return "border-[var(--amber-soft-border)] bg-[var(--amber-soft-bg)] text-[var(--amber-soft-text)]";
    case "calm":
      return "border-[var(--glass-border)] bg-[var(--hover-overlay)] text-[var(--muted)]";
  }
}

function GraduationBanner() {
  const { graduationOffer, isGraduating } = useHealthData();
  const { graduateGoal, dismissGraduationOffer } = useHealthActions();
  const [habitName, setHabitName] = useState("");

  useEffect(() => {
    if (graduationOffer) setHabitName(graduationOffer.title);
  }, [graduationOffer]);

  if (!graduationOffer) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--violet-soft-border)] bg-[var(--violet-soft-bg)] p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Sparkles size={14} className="shrink-0 text-[var(--violet-soft-text)]" />
        <span className="text-xs leading-relaxed text-[var(--foreground)]">
          Meta cumplida. ¿La convertimos en hábito diario para que se quede ganada?
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          value={habitName}
          onChange={(event) => setHabitName(event.target.value)}
          disabled={isGraduating}
          aria-label="Nombre del hábito"
          className="glass-input w-44 px-3 py-1.5 text-xs"
        />
        <button
          type="button"
          onClick={() => habitName.trim() && graduateGoal(graduationOffer.goalId, habitName.trim())}
          disabled={!habitName.trim() || isGraduating}
          className="btn-primary px-3 py-1.5 text-xs disabled:opacity-30"
        >
          {isGraduating ? "Creando..." : "Crear hábito"}
        </button>
        <button
          type="button"
          onClick={dismissGraduationOffer}
          aria-label="Descartar"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

export function GoalsSection() {
  const {
    goals,
    isLoadingGoals,
    goalsError,
    newGoalTitle,
    newGoalTargetDate,
    isCreatingGoal,
  } = useHealthData();
  const {
    setNewGoalTitle,
    setNewGoalTargetDate,
    createGoal,
    completeGoal,
    dropGoal,
    isGoalBusy,
  } = useHealthActions();

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--divider)] p-4">
        <Flag size={16} style={{ color: "var(--amber-soft-text)" }} />
        <h3 className="text-sm font-medium text-[var(--foreground)]">Metas con fecha límite</h3>
        <span className="ml-auto text-xs text-[var(--muted)]">
          Cumplida, arrancada o soltada — que no venza sola
        </span>
      </div>

      <form
        onSubmit={createGoal}
        className="grid grid-cols-1 gap-2 border-b border-[var(--divider)] p-4 sm:grid-cols-[2fr_1fr_auto]"
      >
        <input
          value={newGoalTitle}
          onChange={(event) => setNewGoalTitle(event.target.value)}
          placeholder='Meta, ej: "Empezar el gym"'
          disabled={isCreatingGoal}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <input
          type="date"
          value={newGoalTargetDate}
          onChange={(event) => setNewGoalTargetDate(event.target.value)}
          aria-label="Fecha límite"
          disabled={isCreatingGoal}
          className="glass-input min-w-0 px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={!newGoalTitle.trim() || !newGoalTargetDate || isCreatingGoal}
          aria-label="Crear meta"
          className="btn-primary justify-center p-2.5 disabled:opacity-30"
        >
          <Plus size={15} />
        </button>
      </form>

      <div className="space-y-2.5 p-4">
        <GraduationBanner />

        {isLoadingGoals && <div className="skeleton h-14 w-full" />}

        {goalsError && !isLoadingGoals && (
          <p className="p-2 text-sm text-[var(--red-soft-text)]">
            No se pudieron cargar las metas. Probá recargar la página.
          </p>
        )}

        {!isLoadingGoals && !goalsError && goals.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Sin metas abiertas
            </p>
            <p className="mx-auto mt-1 max-w-[320px] text-xs leading-relaxed text-[var(--muted)]">
              Una meta es un resultado con fecha: empezar el gym, arrancar la
              dieta. Cuando se cumple, se convierte en hábito.
            </p>
          </div>
        )}

        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] px-4 py-3 transition-all hover:bg-[var(--hover-overlay)]"
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-[var(--foreground)]">{goal.title}</span>
              <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                límite: {goal.targetDate}
              </div>
            </div>

            <span
              className={`font-data shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold ${urgencyClassName(goalUrgency(goal))}`}
            >
              {goalDeadlineLabel(goal)}
            </span>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => completeGoal(goal.id)}
                disabled={isGoalBusy(goal.id)}
                title="Marcar como cumplida"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-all hover:scale-105 disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => dropGoal(goal.id)}
                disabled={isGoalBusy(goal.id)}
                title="Soltar la meta"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--glass-border)] text-[var(--muted)] transition-all hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
