import { observable, type Observable } from "@nbottarini/observable";

/**
 * Cross-section coordination for the health screen's autonomous presenters.
 * The only cross-section signal today: graduating a goal creates a habit, so
 * GoalsPresenter fires habitsChanged and HabitsPresenter reloads. Add more
 * signals here when a second cross-section dependency appears. React-free.
 */
export class HealthEvents {
  private readonly _habitsChanged = observable<void>();

  get habitsChanged(): Observable<void> {
    return this._habitsChanged;
  }

  emitHabitsChanged(): Promise<void> {
    return this._habitsChanged.notify();
  }
}
