import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { DeleteTimeEntry } from "@/core/app/projects/DeleteTimeEntry";
import { ListTimeEntries } from "@/core/app/projects/ListTimeEntries";
import { LogTimeEntry } from "@/core/app/projects/LogTimeEntry";
import { formatMinutes, hoursToMinutes, type TimeEntry } from "@/core/domain/projects/TimeEntry";
import { formatTaskDate, getTodayISO } from "@/lib/format";
import type { TimeTrackingViewModel } from "@/ui/models/projects/TimeTrackingViewModel";

type LogFormState = {
  date: string;
  hours: string;
  note: string;
  isSaving: boolean;
};

export class TimeTrackingPresenter extends PresenterBase<TimeTrackingViewModel> {
  private entries: TimeEntry[] = [];
  private busyEntryIds = new Set<string>();
  private isLoading = true;
  private error: string | null = null;
  private form: LogFormState = {
    date: getTodayISO(),
    hours: "",
    note: "",
    isSaving: false,
  };

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly projectId: string | null,
  ) {
    super(onChange);
  }

  protected initModel(): TimeTrackingViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  setDate(date: string): void {
    this.form.date = date;
    this.refresh();
  }

  setHours(hours: string): void {
    this.form.hours = hours;
    this.refresh();
  }

  setNote(note: string): void {
    this.form.note = note;
    this.refresh();
  }

  async logEntry(): Promise<void> {
    const minutes = hoursToMinutes(this.form.hours);
    if (!this.projectId || minutes === null || !this.form.date || this.form.isSaving) return;
    this.form.isSaving = true;
    this.refresh();
    try {
      await this.core.execute(
        new LogTimeEntry({
          projectId: this.projectId,
          date: this.form.date,
          minutes,
          note: this.form.note.trim() || null,
        }),
      );
      this.form = { date: this.form.date, hours: "", note: "", isSaving: false };
      await this.load();
    } catch {
      this.error = "No pudimos registrar el tiempo.";
      this.form.isSaving = false;
      this.refresh();
    }
  }

  async deleteEntry(id: string): Promise<void> {
    if (this.busyEntryIds.has(id)) return;
    this.busyEntryIds.add(id);
    this.refresh();
    try {
      await this.core.execute(new DeleteTimeEntry(id));
      await this.load();
    } catch {
      this.error = "No pudimos borrar el registro.";
    } finally {
      this.busyEntryIds.delete(id);
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    if (!this.projectId) {
      this.entries = [];
      this.isLoading = false;
      this.refresh();
      return;
    }
    this.isLoading = true;
    this.refresh();
    try {
      this.entries = await this.core.execute(new ListTimeEntries({ projectId: this.projectId }));
      this.error = null;
    } catch {
      this.error = "No pudimos cargar los registros de tiempo.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): TimeTrackingViewModel {
    const sorted = [...this.entries].sort((left, right) => right.date.localeCompare(left.date));
    const totalMinutes = sorted.reduce((sum, entry) => sum + entry.minutes, 0);
    return {
      projectId: this.projectId,
      isLoading: this.isLoading,
      error: this.error,
      totalLabel: formatMinutes(totalMinutes),
      entries: sorted.map((entry) => ({
        id: entry.id,
        dateLabel: formatTaskDate(entry.date),
        durationLabel: formatMinutes(entry.minutes),
        note: entry.note,
        isBusy: this.busyEntryIds.has(entry.id),
      })),
      form: {
        date: this.form.date,
        hours: this.form.hours,
        note: this.form.note,
        isSaving: this.form.isSaving,
        canSubmit: hoursToMinutes(this.form.hours) !== null && this.form.date.length > 0 && !this.form.isSaving,
      },
    };
  }
}
