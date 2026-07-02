export interface HoursReportPrintRowVM {
  key: string;
  projectOutcome: string;
  clientName: string | null;
  weekLabel: string;
  durationLabel: string;
  expectedIncomeLabel: string | null;
}

export interface HoursReportPrintIncomeVM {
  currency: "ARS" | "USD";
  amountLabel: string;
}

export interface HoursReportPrintViewModel {
  isLoading: boolean;
  error: string | null;
  periodLabel: string;
  generatedAtLabel: string;
  totalLabel: string;
  incomeTotals: HoursReportPrintIncomeVM[];
  rows: HoursReportPrintRowVM[];
  hasRows: boolean;
}
