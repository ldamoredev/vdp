export interface OperationalHeaderViewModel {
  /** Today's completion. */
  completionRate: number;
  completed: number;
  total: number;
  /** Pressure: hot pending tasks (high priority or carried over). */
  urgentCount: number;
  stuckCount: number;
  highPriorityCount: number;
  pressureValue: number;
  pressureSub: string;
  /** 7-day rhythm. */
  completionAverage: number;
  pendingCount: number;
  doneCount: number;
  rhythmSub: string;
  /** Reschedule-all (carry pending to tomorrow). */
  canReschedule: boolean;
  isRescheduling: boolean;
}
