import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { GetHoursReport } from "@/core/app/projects/GetHoursReport";
import { formatMinutes, ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import { addLocalDaysISO, formatMoney, formatTaskDate, getTodayISO } from "@/lib/format";
import type { HoursReportViewModel } from "@/ui/models/projects/HoursReportViewModel";

export class HoursReportPresenter extends PresenterBase<HoursReportViewModel> {
  private report: ProjectHoursReport | null = null;
  private isLoading = true;
  private error: string | null = null;
  private fromDate = addLocalDaysISO(getTodayISO(), -30);
  private toDate = getTodayISO();

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
  ) {
    super(onChange);
  }

  protected initModel(): HoursReportViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
  }

  setFromDate(date: string): void {
    this.fromDate = date;
    this.refresh();
  }

  setToDate(date: string): void {
    this.toDate = date;
    this.refresh();
  }

  reload(): Promise<void> {
    return this.load();
  }

  private async load(): Promise<void> {
    if (!this.fromDate || !this.toDate || this.fromDate > this.toDate) {
      this.error = "El rango de fechas no es válido.";
      this.isLoading = false;
      this.refresh();
      return;
    }
    this.isLoading = true;
    this.refresh();
    try {
      this.report = await this.core.execute(
        new GetHoursReport({ fromDate: this.fromDate, toDate: this.toDate }),
      );
      this.error = null;
    } catch {
      this.error = "No pudimos generar el reporte de horas.";
    } finally {
      this.isLoading = false;
      this.refresh();
    }
  }

  private refresh(): void {
    this.updateModel(this.buildModel());
  }

  private buildModel(): HoursReportViewModel {
    return {
      isLoading: this.isLoading,
      error: this.error,
      fromDate: this.fromDate,
      toDate: this.toDate,
      totalLabel: formatMinutes(this.report?.totalMinutes ?? 0),
      incomeTotals: (this.report?.incomeTotals ?? []).map((income) => ({
        currency: income.currency,
        amountLabel: formatMoney(income.amount, income.currency),
      })),
      rows: (this.report?.rows ?? []).map((row, index) => ({
        key: `${row.projectId}-${row.weekStart}-${index}`,
        projectOutcome: row.projectOutcome,
        clientName: row.clientName,
        weekLabel: `Semana del ${formatTaskDate(row.weekStart)}`,
        durationLabel: formatMinutes(row.minutes),
        expectedIncomeLabel: row.expectedIncome
          ? formatMoney(row.expectedIncome.amount, row.expectedIncome.currency)
          : null,
        registerIncomeHref: row.expectedIncome ? registerIncomeHref(row.projectOutcome, row.expectedIncome) : null,
      })),
    };
  }
}

function registerIncomeHref(
  projectOutcome: string,
  income: { amount: string; currency: "ARS" | "USD" },
): string {
  const params = new URLSearchParams({
    type: "income",
    amount: income.amount,
    currency: income.currency,
    description: projectOutcome,
  });
  return `/wallet/transactions/new?${params.toString()}`;
}
