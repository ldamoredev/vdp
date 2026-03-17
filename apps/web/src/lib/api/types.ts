// ─── Shared ──────────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ─── Tasks ───────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: "pending" | "done" | "carried_over" | "discarded";
  scheduledDate: string;
  domain: string | null;
  carryOverCount: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface TaskTrendDay {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
}

export interface TaskReview {
  date: string;
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
  tasks: Task[];
  note?: string;
}

export interface DomainStat {
  domain: string;
  total: number;
  completed: number;
  rate: number;
}

// ─── Wallet ──────────────────────────────────────────────
export interface Account {
  id: string;
  name: string;
  currency: string;
  type: string;
  initialBalance: string;
  currentBalance?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  categoryName?: string;
  type: "income" | "expense" | "transfer";
  amount: string;
  currency: string;
  description: string | null;
  date: string;
  tags: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  deadline: string | null;
  isCompleted: boolean;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  currency: string;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string | null;
  rate: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface WalletStatsSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  type: string;
  date: string;
}

// ─── Health ──────────────────────────────────────────────
export interface HealthMetric {
  id: string;
  metricType: string;
  value: string;
  unit: string | null;
  recordedAt: string;
  source: string | null;
  notes: string | null;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  targetValue: number | null;
  unit: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  streak?: number;
  completedToday?: boolean;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  value: number | null;
  notes: string | null;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string;
  timeOfDay: string | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string;
  skipped: boolean;
  notes: string | null;
}

export interface Appointment {
  id: string;
  title: string;
  doctorName: string | null;
  specialty: string | null;
  location: string | null;
  scheduledAt: string;
  durationMinutes: number | null;
  status: "upcoming" | "completed" | "cancelled";
  notes: string | null;
}

export interface BodyMeasurement {
  id: string;
  measurementType: string;
  value: string;
  unit: string | null;
  date: string;
  notes: string | null;
}

export interface TodaySummary {
  metrics: Record<string, { value: string; unit: string }>;
  habitsCompleted: number;
  habitsTotal: number;
}

export interface WeeklyStat {
  date: string;
  metrics: Record<string, number>;
}
