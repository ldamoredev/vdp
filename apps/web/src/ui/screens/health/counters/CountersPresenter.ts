import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { sortCounters, type Counter } from "@/core/domain/health/Counter";
import { ArchiveCounter } from "@/core/app/health/ArchiveCounter";
import { CreateCounter } from "@/core/app/health/CreateCounter";
import { GetCountersOverview } from "@/core/app/health/GetCountersOverview";
import { RelapseCounter } from "@/core/app/health/RelapseCounter";
import { formatMoney } from "@/lib/format";
import type { CounterCardVM, CountersViewModel } from "@/ui/models/health/CountersViewModel";

const RELAPSE_CONFIRM_MS = 4000;

/** "Days since" counters: list, create, relapse (two-step confirm), archive. */
export class CountersPresenter extends PresenterBase<CountersViewModel> {
  private counters: Counter[] = [];
  private busyIds = new Set<string>();
  private confirmingIds = new Set<string>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private isLoading = true;
  private error = false;
  private isCreating = false;
  private newName = "";
  private newDailyCost = "";
  private newStartedAt = "";

  constructor(onChange: ChangeFunc, private readonly core: Core) {
    super(onChange);
  }

  protected initModel(): CountersViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  stop(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  setNewName(value: string): void {
    this.newName = value;
    this.refresh();
  }

  setNewDailyCost(value: string): void {
    this.newDailyCost = value;
    this.refresh();
  }

  setNewStartedAt(value: string): void {
    this.newStartedAt = value;
    this.refresh();
  }

  async create(): Promise<void> {
    const name = this.newName.trim();
    if (!name || this.isCreating) return;
    this.isCreating = true;
    this.refresh();
    try {
      const dailyCost = this.newDailyCost.trim();
      await this.core.execute(
        new CreateCounter({
          name,
          dailyCost: dailyCost ? dailyCost : null,
          startedAt: this.newStartedAt || undefined,
        }),
      );
      this.newName = "";
      this.newDailyCost = "";
      this.newStartedAt = "";
      await this.load();
    } finally {
      this.isCreating = false;
      this.refresh();
    }
  }

  /** Two-step: first call arms the confirm state, second one relapses. */
  requestRelapse(id: string): void {
    if (!this.confirmingIds.has(id)) {
      this.confirmingIds.add(id);
      this.refresh();
      const timer = setTimeout(() => {
        this.confirmingIds.delete(id);
        this.timers.delete(id);
        this.refresh();
      }, RELAPSE_CONFIRM_MS);
      this.timers.set(id, timer);
      return;
    }
    this.clearConfirm(id);
    void this.runForId(id, async () => {
      await this.core.execute(new RelapseCounter(id));
      await this.load();
    });
  }

  async archive(id: string): Promise<void> {
    this.clearConfirm(id);
    await this.runForId(id, async () => {
      await this.core.execute(new ArchiveCounter(id));
      await this.load();
    });
  }

  private async load(): Promise<void> {
    try {
      const { counters } = await this.core.execute(new GetCountersOverview());
      this.counters = sortCounters(counters);
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

  private clearConfirm(id: string): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.confirmingIds.delete(id);
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): CountersViewModel {
    return {
      counters: this.counters.map((counter) => this.counterVM(counter)),
      isLoading: this.isLoading,
      error: this.error,
      newName: this.newName,
      newDailyCost: this.newDailyCost,
      newStartedAt: this.newStartedAt,
      isCreating: this.isCreating,
      canCreate: this.newName.trim().length > 0 && !this.isCreating,
    };
  }

  private counterVM(counter: Counter): CounterCardVM {
    return {
      id: counter.id,
      displayName: counter.emoji ? `${counter.emoji} ${counter.name}` : counter.name,
      currentDays: counter.currentDays,
      daysUnit: counter.currentDays === 1 ? "día" : "días",
      contextLabel: this.contextLabel(counter),
      moneyNotSpentLabel: counter.moneyNotSpent
        ? `≈ ${formatMoney(Number(counter.moneyNotSpent), "ARS")} que no se fueron`
        : null,
      confirmingRelapse: this.confirmingIds.has(counter.id),
      busy: this.busyIds.has(counter.id),
    };
  }

  private contextLabel(counter: Counter): string {
    if (counter.attemptCount > 1) {
      return `mejor intento: ${counter.bestDays} · intento #${counter.attemptCount}`;
    }
    return counter.currentDays === 0 ? "Arrancó hoy" : `desde ${counter.startedAt}`;
  }
}
