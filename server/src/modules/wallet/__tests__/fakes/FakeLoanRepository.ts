import { CreateLoanData, Loan } from '../../domain/Loan';
import { LoanRepository } from '../../domain/LoanRepository';

export class FakeLoanRepository extends LoanRepository {
    private store = new Map<string, ReturnType<Loan['toSnapshot']>>();
    private owners = new Map<string, string>();

    async createLoan(userId: string, data: CreateLoanData): Promise<Loan> {
        const loan = Loan.create(data);
        this.store.set(loan.id, loan.toSnapshot());
        this.owners.set(loan.id, userId);
        return loan;
    }

    async listLoans(userId: string): Promise<Loan[]> {
        return Array.from(this.store.entries())
            .filter(([id]) => this.owners.get(id) === userId)
            .map(([, snapshot]) => Loan.fromSnapshot(snapshot));
    }

    async getLoan(userId: string, id: string): Promise<Loan | null> {
        if (this.owners.get(id) !== userId) return null;
        const snapshot = this.store.get(id);
        return snapshot ? Loan.fromSnapshot(snapshot) : null;
    }

    async save(userId: string, loan: Loan): Promise<Loan> {
        if (this.owners.get(loan.id) !== userId) throw new Error('Loan not found');
        this.store.set(loan.id, loan.toSnapshot());
        return loan;
    }
}
