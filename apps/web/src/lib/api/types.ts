// ─── Shared API contract ─────────────────────────────────
//
// Response shapes for tasks and wallet live in @vdp/shared and are re-exported
// here so feature code keeps importing from "@/lib/api/types". Do not redefine
// server response types locally: extend them in packages/shared instead.
export type {
  // Envelope
  PaginationMeta,
  PaginatedCollection,
  // Unions
  Currency,
  AccountType,
  TransactionType,
  CategoryType,
  InvestmentType,
  ExchangeRateType,
  // Tasks
  TaskStatus,
  Task,
  TaskListResponse,
  TaskNote,
  TaskDetailsResponse,
  TaskInsightAction,
  TaskInsightMetadata,
  TaskInsight,
  TaskStats,
  TaskTrendDay,
  TaskReview,
  DomainStat,
  CarryOverAllResult,
  CarryOverRateResponse,
  // Wallet
  Account,
  Transaction,
  WalletTransactionListResponse,
  Category,
  SavingsGoal,
  Investment,
  WalletStatsSummary,
  CategoryStat,
  MonthlyTrend,
  ExchangeRate,
  // Health
  Habit,
  HabitOverview,
  HabitsOverviewResponse,
  Counter,
  CounterOverview,
  CountersOverviewResponse,
  GoalStatus,
  Goal,
  GoalOverview,
  GoalsOverviewResponse,
  GraduateGoalResponse,
} from "@vdp/shared";
