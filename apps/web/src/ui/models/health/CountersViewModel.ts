export interface CountersViewModel {
  counters: CounterCardVM[];
  isLoading: boolean;
  error: boolean;
  newName: string;
  newDailyCost: string;
  newStartedAt: string;
  isCreating: boolean;
  canCreate: boolean;
}

export interface CounterCardVM {
  id: string;
  displayName: string;
  currentDays: number;
  daysUnit: string;
  contextLabel: string;
  moneyNotSpentLabel: string | null;
  confirmingRelapse: boolean;
  busy: boolean;
}
