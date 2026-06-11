import { TransactionRepository } from '../domain/TransactionRepository';
import { EventBus } from '../../common/base/event-bus/EventBus';
import { SpendingSpike } from '../domain/events/SpendingSpike';
import { Logger } from '../../common/base/observability/logging/Logger';

const SPIKE_THRESHOLD_PERCENT = 50;
const COMPARISON_WEEKS = 4;

export class DetectSpendingSpike {
    constructor(
        private readonly transactions: TransactionRepository,
        private readonly eventBus: EventBus,
        private readonly logger: Logger,
    ) {}

    async execute(userId: string): Promise<void> {
        const now = new Date();
        const thisWeekStart = this.weekStart(now);
        const thisWeekEnd = this.formatDate(now);

        // Expenses are compared per currency: ARS and USD amounts must never be
        // mixed in the same average.
        const currentByCurrency = await this.sumExpenses(userId, thisWeekStart, thisWeekEnd);
        if (currentByCurrency.size === 0) return;

        const previousWeeks: Map<string, number>[] = [];
        for (let i = 1; i <= COMPARISON_WEEKS; i++) {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - 7 * i);
            const weekStart = this.weekStart(weekEnd);
            previousWeeks.push(await this.sumExpenses(userId, weekStart, this.formatDate(weekEnd)));
        }

        for (const [currency, currentExpenses] of currentByCurrency) {
            if (currentExpenses === 0) continue;

            const weeklyTotals = previousWeeks.map((week) => week.get(currency) ?? 0);
            const avgExpenses = weeklyTotals.reduce((a, b) => a + b, 0) / weeklyTotals.length;
            if (avgExpenses === 0) continue;

            const percentageIncrease = ((currentExpenses - avgExpenses) / avgExpenses) * 100;
            if (percentageIncrease < SPIKE_THRESHOLD_PERCENT) continue;

            this.logger.info('spending spike detected', {
                currency,
                currentExpenses: currentExpenses.toFixed(2),
                avgExpenses: avgExpenses.toFixed(2),
                percentageIncrease: Math.round(percentageIncrease),
            });

            await this.eventBus.emit(
                new SpendingSpike({
                    userId,
                    totalExpenses: currentExpenses.toFixed(2),
                    previousAverage: avgExpenses.toFixed(2),
                    percentageIncrease: Math.round(percentageIncrease),
                    currency,
                    periodFrom: thisWeekStart,
                    periodTo: thisWeekEnd,
                }),
            );
        }
    }

    private async sumExpenses(userId: string, from: string, to: string): Promise<Map<string, number>> {
        const totals = await this.transactions.sumExpensesByCurrency(userId, from, to);
        return new Map(totals.map(({ currency, total }) => [currency, Math.abs(parseFloat(total))]));
    }

    private weekStart(date: Date): string {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
        return this.formatDate(d);
    }

    private formatDate(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
