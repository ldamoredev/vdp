import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { sortHabitsForToday, summarizeHabits, type Habit } from "@/core/domain/health/Habit";
import { ArchiveHabit } from "@/core/app/health/ArchiveHabit";
import { CompleteHabit } from "@/core/app/health/CompleteHabit";
import { CreateHabit } from "@/core/app/health/CreateHabit";
import { GetHabitsOverview } from "@/core/app/health/GetHabitsOverview";
import { UncompleteHabit } from "@/core/app/health/UncompleteHabit";
import type { HealthEvents } from "@/ui/events/HealthEvents";
import type { HabitRowVM, HabitsViewModel } from "@/ui/models/health/HabitsViewModel";

/** Daily habits: list, create, toggle, archive. Reloads when a goal graduates. */
export class HabitsPresenter extends PresenterBase<HabitsViewModel> {
  private habits: Habit[] = [];
  private busyIds = new Set<string>();
  private isLoading = true;
  private error = false;
  private isCreating = false;
  private newHabitName = "";

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly events: HealthEvents,
  ) {
    super(onChange);
  }

  protected initModel(): HabitsViewModel {
    return this.buildModel();
  }

  start(): void {
    this.events.habitsChanged.subscribe(this, () => void this.load());
    void this.load();
  }

  stop(): void {
    this.events.habitsChanged.unsubscribe(this);
  }

  setNewHabitName(value: string): void {
    this.newHabitName = value;
    this.refresh();
  }

  async createHabit(): Promise<void> {
    const name = this.newHabitName.trim();
    if (!name || this.isCreating) return;
    this.isCreating = true;
    this.refresh();
    try {
      await this.core.execute(new CreateHabit({ name }));
      this.newHabitName = "";
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  async toggle(id: string): Promise<void> {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return;
    const command = habit.completedToday ? new UncompleteHabit(id) : new CompleteHabit(id);
    await this.runForId(id, async () => {
      await this.core.execute(command);
      await this.load();
    });
  }

  async archive(id: string): Promise<void> {
    await this.runForId(id, async () => {
      await this.core.execute(new ArchiveHabit(id));
      await this.load();
    });
  }

  private async load(): Promise<void> {
    try {
      const { habits } = await this.core.execute(new GetHabitsOverview());
      this.habits = sortHabitsForToday(habits);
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

  private buildModel(): HabitsViewModel {
    const summary = summarizeHabits(this.habits);
    return {
      habits: this.habits.map((habit) => this.habitVM(habit)),
      completedToday: summary.completedToday,
      total: summary.total,
      showSummary: summary.total > 0,
      allDone: summary.allDone,
      isLoading: this.isLoading,
      error: this.error,
      newHabitName: this.newHabitName,
      isCreating: this.isCreating,
      canCreate: this.newHabitName.trim().length > 0 && !this.isCreating,
    };
  }

  private habitVM(habit: Habit): HabitRowVM {
    return {
      id: habit.id,
      displayName: habit.emoji ? `${habit.emoji} ${habit.name}` : habit.name,
      completedToday: habit.completedToday,
      streak: habit.streak,
      showStreakBadge: habit.streak >= 2,
      streakLabel: this.streakLabel(habit),
      busy: this.busyIds.has(habit.id),
    };
  }

  private streakLabel(habit: Habit): string | null {
    if (habit.streak >= 2) return `${habit.streak} días seguidos`;
    if (habit.streak === 1 && habit.completedToday) return "Arrancó hoy";
    if (habit.bestStreak >= 3 && habit.streak === 0) return `Mejor racha: ${habit.bestStreak}`;
    return null;
  }
}
