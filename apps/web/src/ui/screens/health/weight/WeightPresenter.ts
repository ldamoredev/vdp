import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";
import type { WeightEntry, WeightTrendResponse } from "@vdp/shared";

import type { Core } from "@/core/Core";
import { GetWeightTrend } from "@/core/app/health/GetWeightTrend";
import { SaveWeightEntry } from "@/core/app/health/SaveWeightEntry";
import { sortWeightEntries } from "@/core/domain/health/Weight";
import { formatDateShort } from "@/lib/format";
import type { WeightEntryRowVM, WeightSparklineVM, WeightViewModel } from "@/ui/models/health/WeightViewModel";

const TREND_DAYS = 30;

export class WeightPresenter extends PresenterBase<WeightViewModel> {
  private trend: WeightTrendResponse | null = null;
  private isLoading = true;
  private error = false;
  private isSaving = false;
  private newWeight = "";
  private newDate = "";

  constructor(onChange: ChangeFunc, private readonly core: Core) {
    super(onChange);
  }

  protected initModel(): WeightViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  setNewWeight(value: string): void {
    this.newWeight = value;
    this.refresh();
  }

  setNewDate(value: string): void {
    this.newDate = value;
    this.refresh();
  }

  async save(): Promise<void> {
    const weightKg = this.newWeight.trim();
    if (!weightKg || this.isSaving) return;
    this.isSaving = true;
    this.refresh();
    try {
      await this.core.execute(new SaveWeightEntry({
        weightKg,
        ...(this.newDate ? { date: this.newDate } : {}),
      }));
      this.newWeight = "";
      this.newDate = "";
      await this.load();
    } finally {
      this.isSaving = false;
      this.refresh();
    }
  }

  private async load(): Promise<void> {
    try {
      this.trend = await this.core.execute(new GetWeightTrend(TREND_DAYS));
      this.error = false;
    } catch {
      this.error = true;
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): WeightViewModel {
    const entries = sortWeightEntries(this.trend?.entries ?? []);
    return {
      isLoading: this.isLoading,
      error: this.error,
      newWeight: this.newWeight,
      newDate: this.newDate,
      isSaving: this.isSaving,
      canSave: this.newWeight.trim().length > 0 && !this.isSaving,
      currentWeightLabel: this.currentWeightLabel(),
      changeLabel: this.changeLabel(),
      rangeLabel: `${TREND_DAYS} días`,
      sparkline: this.sparkline(entries),
      entries: entries.slice(-5).reverse().map((entry) => this.entryVM(entry)),
    };
  }

  private currentWeightLabel(): string {
    const current = this.trend?.summary.currentWeightKg;
    return current ? `${formatKg(current)} kg` : "Sin registro";
  }

  private changeLabel(): string {
    const change = this.trend?.summary.changeKg;
    if (!change) return "sin tendencia";
    const absolute = formatKg(Math.abs(Number(change)).toString());
    if (Number(change) < 0) return `bajó ${absolute} kg`;
    if (Number(change) > 0) return `subió ${absolute} kg`;
    return "sin cambios";
  }

  private entryVM(entry: WeightEntry): WeightEntryRowVM {
    return {
      id: entry.id,
      dateLabel: formatDateShort(entry.date),
      weightLabel: `${formatKg(entry.weightKg)} kg`,
    };
  }

  private sparkline(entries: WeightEntry[]): WeightSparklineVM | null {
    if (entries.length < 2) return null;
    const values = entries.map((entry) => Number(entry.weightKg));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 120;
    const height = 36;
    const points = values
      .map((value, index) => {
        const x = entries.length === 1 ? width : (index / (entries.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${round(x)},${round(y)}`;
      })
      .join(" ");

    return {
      points,
      minLabel: `${formatKg(min.toString())}`,
      maxLabel: `${formatKg(max.toString())}`,
    };
  }
}

function formatKg(value: string): string {
  return Number(value).toFixed(1);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
