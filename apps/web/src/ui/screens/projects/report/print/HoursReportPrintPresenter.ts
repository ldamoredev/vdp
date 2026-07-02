import { ChangeFunc, PresenterBase } from "@nbottarini/react-presenter";

import type { Core } from "@/core/Core";
import { GetHoursReport } from "@/core/app/projects/GetHoursReport";
import { formatMinutes, ProjectHoursReport } from "@/core/domain/projects/TimeEntry";
import { formatDate, formatMoney, formatTaskDate, getTodayISO } from "@/lib/format";
import type { HoursReportPrintViewModel } from "@/ui/models/projects/HoursReportPrintViewModel";

export class HoursReportPrintPresenter extends PresenterBase<HoursReportPrintViewModel> {
  private report: ProjectHoursReport | null = null;
  private isLoading = true;
  private error: string | null = null;

  constructor(
    onChange: ChangeFunc,
    private readonly core: Core,
    private readonly fromDate: string,
    private readonly toDate: string,
  ) {
    super(onChange);
  }

  protected initModel(): HoursReportPrintViewModel {
    return this.buildModel();
  }

  start(): void {
    void this.load();
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

  private buildModel(): HoursReportPrintViewModel {
    const rows = this.report?.rows ?? [];
    return {
      isLoading: this.isLoading,
      error: this.error,
      periodLabel: `Del ${formatDate(this.fromDate)} al ${formatDate(this.toDate)}`,
      generatedAtLabel: formatDate(getTodayISO()),
      totalLabel: formatMinutes(this.report?.totalMinutes ?? 0),
      incomeTotals: (this.report?.incomeTotals ?? []).map((income) => ({
        currency: income.currency,
        amountLabel: formatMoney(income.amount, income.currency),
      })),
      rows: rows.map((row, index) => ({
        key: `${row.projectId}-${row.weekStart}-${index}`,
        projectOutcome: row.projectOutcome,
        clientName: row.clientName,
        weekLabel: `Semana del ${formatTaskDate(row.weekStart)}`,
        durationLabel: formatMinutes(row.minutes),
        expectedIncomeLabel: row.expectedIncome
          ? formatMoney(row.expectedIncome.amount, row.expectedIncome.currency)
          : null,
      })),
      hasRows: rows.length > 0,
    };
  }
}
