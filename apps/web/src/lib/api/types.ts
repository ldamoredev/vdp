// ─── Shared ──────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export type PaginatedCollection<TKey extends string, TItem> = Record<TKey, TItem[]> &
  PaginationMeta;

export type TaskListResponse = PaginatedCollection<"tasks", Task>;

export type WalletTransactionListResponse = PaginatedCollection<
  "transactions",
  Transaction
>;

// ─── Tasks ───────────────────────────────────────────────
export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  status: "pending" | "done" | "discarded";
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
  carriedOver: number;
  discarded: number;
  completionRate: number;
  pendingTasks: Task[];
  allTasks: Task[];
  note?: string;
}

export interface DomainStat {
  domain: string;
  total: number;
  completed: number;
  rate: number;
}

export interface CarryOverAllResult {
  carriedOver: number;
  tasks: Task[];
}

export interface CarryOverRateResponse {
  total: number;
  carriedOver: number;
  rate: number;
  days: number;
}

export interface TaskNote {
  id: string;
  taskId: string;
  content: string;
  type: "note" | "breakdown_step" | "blocker";
  createdAt: string;
}

export interface TaskDetailsResponse {
  task: Task;
  notes: TaskNote[];
}

export interface AgentConversation {
  id: string;
  domain: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentToolCallRecord {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface AgentToolResultRecord {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface AgentMessageRecord {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "tool";
  content: string | null;
  toolCalls: AgentToolCallRecord[] | null;
  toolResult: AgentToolResultRecord | null;
  createdAt: string;
}

// ─── Wallet ──────────────────────────────────────────────
//
// Union types imported from @vdp/shared to prevent drift.
// The interfaces below are API response shapes (string dates, optional fields,
// enriched fields like categoryName) — they intentionally differ from the
// domain models in @vdp/shared which use Date objects.
//
import type {
  Currency,
  AccountType,
  TransactionType,
  CategoryType,
  InvestmentType,
  ExchangeRateType,
} from "@vdp/shared";

export type {
  Currency,
  AccountType,
  TransactionType,
  CategoryType,
  InvestmentType,
  ExchangeRateType,
};

export interface Account {
  id: string;
  name: string;
  currency: Currency;
  type: AccountType;
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
  type: TransactionType;
  amount: string;
  currency: Currency;
  description: string | null;
  date: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: Currency;
  deadline: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  accountId?: string | null;
  currency: Currency;
  investedAmount: string;
  currentValue: string;
  startDate: string;
  endDate: string | null;
  rate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletStatsSummary {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
}

export interface CategoryStat {
  categoryId: string | null;
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
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  type: ExchangeRateType;
  date: string;
  createdAt?: string;
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
