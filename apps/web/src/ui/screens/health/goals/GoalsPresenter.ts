import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { HabitCadence } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { Goal, sortActiveGoals } from "@/core/domain/health/Goal";
import { CompleteGoal } from "@/core/app/health/CompleteGoal";
import { CreateGoal } from "@/core/app/health/CreateGoal";
import { DropGoal } from "@/core/app/health/DropGoal";
import { GetGoalsOverview } from "@/core/app/health/GetGoalsOverview";
import { GraduateGoal } from "@/core/app/health/GraduateGoal";
import type { HealthEvents } from "@/ui/events/HealthEvents";
import type { GoalRowVM, GoalsViewModel } from "@/ui/models/health/GoalsViewModel";

/**
 * Deadline goals: list, create, complete, drop, and the graduation loop
 * (a completed goal can become a habit with cadence). Graduating creates a habit, so
 * it fires events.habitsChanged for HabitsPresenter to reload.
 */
export class GoalsPresenter extends PresenterBase<GoalsViewModel> {
  private goals: Goal[] = [];
  private busyIds = new Set<string>();
  private offer: { goalId: string } | null = null;
  private graduationHabitName = "";
  private graduationCadence: HabitCadence = "daily";
  private graduationWeeklyTarget = 3;
  private isLoading = true;
  private error = false;
  private isCreating = false;
  private isGraduating = false;
  private newTitle = "";
  private newTargetDate = "";
  private newTargetWeight = "";

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly events: HealthEvents,
  ) {
    super(onChange);
  }

  protected initModel(): GoalsViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  setNewTitle(value: string): void {
    this.newTitle = value;
    this.refresh();
  }

  setNewTargetDate(value: string): void {
    this.newTargetDate = value;
    this.refresh();
  }

  setNewTargetWeight(value: string): void {
    this.newTargetWeight = value;
    this.refresh();
  }

  async create(): Promise<void> {
    const title = this.newTitle.trim();
    if (!title || !this.newTargetDate || this.isCreating) return;
    this.isCreating = true;
    this.refresh();
    try {
      const targetWeightKg = this.newTargetWeight.trim();
      await this.core.execute(new CreateGoal({
        title,
        targetDate: this.newTargetDate,
        ...(targetWeightKg ? { targetWeightKg } : {}),
      }));
      this.newTitle = "";
      this.newTargetDate = "";
      this.newTargetWeight = "";
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  async complete(id: string): Promise<void> {
    await this.runForId(id, async () => {
      const goal = await this.core.execute(new CompleteGoal(id));
      this.offer = { goalId: goal.id };
      this.graduationHabitName = goal.title;
      this.graduationCadence = "daily";
      this.graduationWeeklyTarget = 3;
      await this.load();
    });
  }

  async drop(id: string): Promise<void> {
    await this.runForId(id, async () => {
      await this.core.execute(new DropGoal(id));
      await this.load();
    });
  }

  setGraduationHabitName(value: string): void {
    this.graduationHabitName = value;
    this.refresh();
  }

  setGraduationCadence(value: HabitCadence): void {
    this.graduationCadence = value;
    this.refresh();
  }

  setGraduationWeeklyTarget(value: number): void {
    this.graduationWeeklyTarget = Math.min(7, Math.max(1, Math.trunc(value)));
    this.refresh();
  }

  async graduate(): Promise<void> {
    const offer = this.offer;
    const habitName = this.graduationHabitName.trim();
    if (!offer || !habitName || this.isGraduating) return;
    this.isGraduating = true;
    this.refresh();
    try {
      await this.core.execute(new GraduateGoal(offer.goalId, {
        habitName,
        cadence: this.graduationCadence,
        ...(this.graduationCadence === "weekly" ? { weeklyTarget: this.graduationWeeklyTarget } : {}),
      }));
      this.offer = null;
      this.graduationHabitName = "";
      await this.load();
      // The new habit lives in another presenter — let it reload.
      await this.events.emitHabitsChanged();
    } finally {
      this.isGraduating = false;
      this.refresh();
    }
  }

  dismissGraduation(): void {
    this.offer = null;
    this.graduationHabitName = "";
    this.graduationCadence = "daily";
    this.graduationWeeklyTarget = 3;
    this.refresh();
  }

  private async load(): Promise<void> {
    try {
      const { goals } = await this.core.execute(new GetGoalsOverview());
      this.goals = sortActiveGoals(goals);
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private async runForId(id: string, block: () => Promise<void>): Promise<void> {
    this.busyIds.add(id);
    this.refresh();
    try {
      await block();
    } finally {
      this.busyIds.delete(id);
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): GoalsViewModel {
    return {
      goals: this.goals.map((goal) => this.goalVM(goal)),
      isLoading: this.isLoading,
      error: this.error,
      newTitle: this.newTitle,
      newTargetDate: this.newTargetDate,
      newTargetWeight: this.newTargetWeight,
      isCreating: this.isCreating,
      canCreate: this.newTitle.trim().length > 0 && this.newTargetDate.length > 0 && !this.isCreating,
      graduation: this.offer
        ? {
            goalId: this.offer.goalId,
            habitName: this.graduationHabitName,
            cadence: this.graduationCadence,
            weeklyTarget: this.graduationWeeklyTarget,
            showWeeklyTarget: this.graduationCadence === "weekly",
            isGraduating: this.isGraduating,
          }
        : null,
    };
  }

  private goalVM(goal: Goal): GoalRowVM {
    return {
      id: goal.id,
      title: goal.title,
      targetDateLabel: `límite: ${goal.targetDate}`,
      targetWeightLabel: goal.targetWeightKg ? `objetivo: ${Number(goal.targetWeightKg).toFixed(1)} kg` : null,
      deadlineLabel: this.deadlineLabel(goal),
      urgency: goal.urgency(),
      busy: this.busyIds.has(goal.id),
    };
  }

  private deadlineLabel(goal: Goal): string {
    if (goal.daysLeft < 0) {
      const days = Math.abs(goal.daysLeft);
      return `venció hace ${days} día${days === 1 ? "" : "s"}`;
    }
    if (goal.daysLeft === 0) return "vence hoy";
    if (goal.daysLeft === 1) return "vence mañana";
    return `${goal.daysLeft} días`;
  }
}
