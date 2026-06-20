import type { TaskCompletedPayload } from '../../tasks/domain/events/TaskCompleted';
import type { SpendingSpikePayload } from '../domain/events/SpendingSpike';
import type { NewWalletInsight } from './WalletInsightsStore';

export class WalletInsightFactory {
    /**
     * tasks→wallet: a completed payment task is money that probably left the
     * wallet. We never auto-write the transaction (the amount is unknown);
     * we suggest registering it, with a deep link that pre-fills the quick-add
     * description from the task title.
     */
    static paymentSuggestion(payload: TaskCompletedPayload): NewWalletInsight {
        return {
            userId: payload.userId,
            type: 'suggestion',
            title: '¿Registrás el gasto?',
            message:
                `Completaste "${payload.title}". Si pagaste algo, registralo para que ` +
                `tus stats y la detección de picos no queden cortas.`,
            metadata: {
                source: 'tasks.task.completed',
                taskId: payload.taskId,
                taskTitle: payload.title,
                scheduledDate: payload.scheduledDate,
                actionHref: `/wallet?registrar-gasto=${encodeURIComponent(payload.title)}`,
                actionLabel: 'Registrar gasto',
            },
        };
    }

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
