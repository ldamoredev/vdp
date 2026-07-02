import { randomUUID } from 'crypto';

export type LoanDirection = 'lent' | 'borrowed';
export type LoanCurrency = 'ARS' | 'USD';
export type LoanStatus = 'open' | 'repaid' | 'forgiven';

export type LoanPayment = {
    readonly id: string;
    readonly amount: string;
    readonly date: string;
    readonly note: string | null;
    readonly createdAt: Date;
};

export type CreateLoanData = {
    readonly direction: LoanDirection;
    readonly counterparty: string;
    readonly principal: string;
    readonly currency: LoanCurrency;
    readonly date: string;
    readonly dueDate?: string | null;
    readonly note?: string | null;
};

export type RegisterPaymentData = {
    readonly amount: string;
    readonly date: string;
    readonly note?: string | null;
};

type LoanSnapshotLike = Omit<LoanSnapshot, 'direction' | 'currency' | 'status'> & {
    direction: string;
    currency: string;
    status: string;
};

export class Loan {
    constructor(
        public id: string,
        public direction: LoanDirection,
        public counterparty: string,
        public principal: string,
        public currency: LoanCurrency,
        public date: string,
        public dueDate: string | null,
        public note: string | null,
        public status: LoanStatus,
        public payments: LoanPayment[],
        public createdAt: Date,
        public updatedAt: Date,
    ) {}

    static create(data: CreateLoanData): Loan {
        const now = new Date();
        return new Loan(
            randomUUID(),
            Loan.parseDirection(data.direction),
            data.counterparty,
            data.principal,
            Loan.parseCurrency(data.currency),
            data.date,
            data.dueDate ?? null,
            data.note ?? null,
            'open',
            [],
            now,
            now,
        );
    }

    /** Sum of registered payments, in the loan's own currency (never cross-currency). */
    paidTotal(): string {
        const total = this.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        return total.toFixed(2);
    }

    /** Amount still owed. Forgiven loans are written off, so nothing is outstanding. */
    outstanding(): string {
        if (this.status === 'forgiven') return '0.00';
        const remaining = parseFloat(this.principal) - parseFloat(this.paidTotal());
        return Math.max(0, remaining).toFixed(2);
    }

    isOpen(): boolean {
        return this.status === 'open';
    }

    registerPayment(data: RegisterPaymentData): LoanPayment {
        if (this.status !== 'open') throw new Error('Cannot register a payment on a loan that is not open');
        const amount = parseFloat(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payment amount must be positive');

        const payment: LoanPayment = {
            id: randomUUID(),
            amount: amount.toFixed(2),
            date: data.date,
            note: data.note ?? null,
            createdAt: new Date(),
        };
        this.payments.push(payment);
        if (parseFloat(this.outstanding()) <= 0) this.status = 'repaid';
        this.updatedAt = new Date();
        return payment;
    }

    markRepaid() {
        if (this.status === 'forgiven') throw new Error('Cannot mark a forgiven loan as repaid');
        if (this.status === 'repaid') return;
        this.status = 'repaid';
        this.updatedAt = new Date();
    }

    forgive() {
        if (this.status === 'repaid') throw new Error('Cannot forgive an already repaid loan');
        if (this.status === 'forgiven') return;
        this.status = 'forgiven';
        this.updatedAt = new Date();
    }

    toSnapshot(): LoanSnapshot {
        return {
            id: this.id,
            direction: this.direction,
            counterparty: this.counterparty,
            principal: this.principal,
            currency: this.currency,
            date: this.date,
            dueDate: this.dueDate,
            note: this.note,
            status: this.status,
            payments: this.payments.map((payment) => ({ ...payment })),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    private static parseDirection(direction: string): LoanDirection {
        switch (direction) {
            case 'lent':
            case 'borrowed':
                return direction;
            default:
                throw new Error(`Invalid loan direction: ${direction}`);
        }
    }

    private static parseCurrency(currency: string): LoanCurrency {
        switch (currency) {
            case 'ARS':
            case 'USD':
                return currency;
            default:
                throw new Error(`Invalid loan currency: ${currency}`);
        }
    }

    private static parseStatus(status: string): LoanStatus {
        switch (status) {
            case 'open':
            case 'repaid':
            case 'forgiven':
                return status;
            default:
                throw new Error(`Invalid loan status: ${status}`);
        }
    }

    static fromSnapshot(s: LoanSnapshotLike): Loan {
        return new Loan(
            s.id,
            Loan.parseDirection(s.direction),
            s.counterparty,
            s.principal,
            Loan.parseCurrency(s.currency),
            s.date,
            s.dueDate,
            s.note,
            Loan.parseStatus(s.status),
            s.payments.map((payment) => ({ ...payment })),
            s.createdAt,
            s.updatedAt,
        );
    }
}

export type LoanSnapshot = {
    id: string;
    direction: LoanDirection;
    counterparty: string;
    principal: string;
    currency: LoanCurrency;
    date: string;
    dueDate: string | null;
    note: string | null;
    status: LoanStatus;
    payments: LoanPayment[];
    createdAt: Date;
    updatedAt: Date;
};
