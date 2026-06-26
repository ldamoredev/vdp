export interface HoursReportRowVM {
  key: string;
  projectOutcome: string;
  clientName: string | null;
  weekLabel: string;
  durationLabel: string;
}

export interface HoursReportViewModel {
  isLoading: boolean;
  error: string | null;
  fromDate: string;
  toDate: string;
  totalLabel: string;
  rows: HoursReportRowVM[];
}
