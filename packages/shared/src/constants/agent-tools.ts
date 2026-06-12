// ─── Agent tool names ────────────────────────────────────
//
// Single registry of the tool names each domain agent exposes. The server
// types its tool definitions against these unions, and the web client derives
// its tool-to-cache sync and display mappings from them, so renaming a tool
// without updating this file fails typecheck on both sides.

export const TASKS_AGENT_TOOL_NAMES = [
  // management
  "create_task",
  "list_tasks",
  "get_task",
  "update_task",
  "delete_task",
  "add_task_note",
  "find_similar_tasks",
  // transitions
  "complete_task",
  "carry_over_task",
  "discard_task",
  "carry_over_all_pending",
  // review / stats
  "get_today_stats",
  "get_completion_trend",
  "get_end_of_day_review",
  // insights / intelligence
  "get_insights",
  "mark_insights_read",
  "get_recommendations",
  "get_planning_context",
  // cross-domain context
  "get_wallet_context",
  "get_weekly_summary",
] as const;

export type TasksAgentToolName = (typeof TASKS_AGENT_TOOL_NAMES)[number];

export const WALLET_AGENT_TOOL_NAMES = [
  // accounts
  "get_accounts",
  "create_account",
  "get_balance",
  // transactions
  "list_transactions",
  "log_transaction",
  // stats
  "spending_summary",
  "get_category_trends",
  "get_spending_anomalies",
  // savings
  "list_savings_goals",
  "create_savings_goal",
  "update_savings_goal",
  "contribute_savings",
  // investments
  "list_investments",
  "create_investment",
  "update_investment",
  // exchange rates
  "get_exchange_rates",
  "create_exchange_rate",
  // cross-domain context
  "get_tasks_context",
] as const;

export type WalletAgentToolName = (typeof WALLET_AGENT_TOOL_NAMES)[number];

export const HEALTH_AGENT_TOOL_NAMES = [
  // habits
  "list_habits",
  "create_habit",
  "complete_habit",
  // counters
  "list_counters",
  "create_counter",
  "relapse_counter",
] as const;

export type HealthAgentToolName = (typeof HEALTH_AGENT_TOOL_NAMES)[number];

export type AgentToolName = TasksAgentToolName | WalletAgentToolName | HealthAgentToolName;
