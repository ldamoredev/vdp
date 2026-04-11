import type { SpendingSpikePayload } from '../domain/events/SpendingSpike';
import type { NewWalletInsight } from './WalletInsightsStore';

export class WalletInsightFactory {
    static spendingSpike(payload: SpendingSpikePayload): NewWalletInsight {
        return {
            userId: payload.userId,
            type: 'warning',
            title: 'Gasto elevado esta semana',
            message:
                `Tu gasto subio ${payload.percentageIncrease}% respecto al promedio ` +
                `(${payload.totalExpenses} vs ${payload.previousAverage} ${payload.currency}).`,
            metadata: {
                source: 'wallet.spending.spike',
                totalExpenses: payload.totalExpenses,
                previousAverage: payload.previousAverage,
                percentageIncrease: payload.percentageIncrease,
                currency: payload.currency,
            },
        };
    }
}
