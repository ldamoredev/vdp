# Objectives Deadline-Approaching Signal (F1.3)

An active objective whose `periodEnd` is near emits
`objectives.objective.deadline_approaching`; Tasks reacts with a decision task +
warning insight (same pattern as `health.goal.deadline_approaching`).

## Trigger and dedupe (H2 lazy-on-load)

Detection runs inside `GetObjectivesOverviewQuery` (backend), following the
counters precedent (`health/services/GetCountersOverview.ts`):

- The persisted `objectives.last_deadline_notified` stage is written **before**
  emitting, so a failed emit costs at most one insight but never duplicates.
- After long gaps only the highest crossed threshold is emitted.
- The overview query is loaded when **either `/objectives` or `/home` loads** —
  both surfaces call `GetObjectivesOverview`. This is why the daily surface
  (`/home`) keeps the signal alive; loading through the plain `ListObjectives`
  would leave it dormant. Repeated loads are idempotent (the dedupe column).

## Thresholds

- Objectives spanning ≤ 90 days (quarterly): warn once at **14 days** left.
- Longer objectives (annual): warn at **30 days**, then escalate at **14 days**.
- Only objectives that are `active` and below target emit.

## Known limitation — non-manual progress

The Objectives backend does not read other modules (AGENTS.md §Cross-Domain),
so it cannot compute read-time progress for `projects_hours`,
`tasks_completed`, `wallet_savings`, or `health_habit_completions`. Therefore:

- For **manual** objectives, the signal is suppressed once `manualValue` reaches
  the target.
- For **non-manual** objectives, an active objective near its deadline emits
  regardless of computed progress. This is intended: a deadline nudge ("your
  quarter ends in N days — accelerate, adjust, or let it go") is useful even
  when on track, and the task/insight copy is honest about not knowing progress
  ("Progreso vinculado a su fuente; se actualiza automáticamente") rather than
  claiming the objective is behind. Objectives already **achieved** are excluded
  (the web presenter lazily persists `active→achieved` when read-time progress
  reaches the target), so a completed objective does not nudge.

If this ever proves noisy in practice, the fix is NOT to make the objectives
backend read other domains — it is to move the below-target gate to where
read-time progress is known (the web presenter) and pass that fact into the
detection. Deferred until real usage shows it matters.
