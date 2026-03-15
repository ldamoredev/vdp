import { eventBus } from "../../core/event-bus/index.js";

/**
 * Wallet domain events.
 *
 * These are emitted when significant things happen in the wallet domain.
 * Other domain agents can subscribe to these to react accordingly.
 */
export const walletEvents = {
  transactionCreated: (data: {
    id: string;
    type: string;
    amount: string;
    currency: string;
    categoryId?: string | null;
    description?: string | null;
  }) => eventBus.emit("wallet", "transaction.created", data),

  spendingSpike: (data: {
    amount: string;
    currency: string;
    dailyAverage: string;
    multiplier: number;
  }) => eventBus.emit("wallet", "spending.spike", data),

  budgetThreshold: (data: {
    categoryId: string;
    categoryName: string;
    spent: string;
    budget: string;
    percentage: number;
  }) => eventBus.emit("wallet", "budget.threshold_reached", data),

  savingsGoalMilestone: (data: {
    goalId: string;
    goalName: string;
    currentAmount: string;
    targetAmount: string;
    percentage: number;
  }) => eventBus.emit("wallet", "savings.milestone", data),

  exchangeRateMovement: (data: {
    fromCurrency: string;
    toCurrency: string;
    type: string;
    oldRate: string;
    newRate: string;
    changePercent: number;
  }) => eventBus.emit("wallet", "exchange_rate.significant_movement", data),
};
