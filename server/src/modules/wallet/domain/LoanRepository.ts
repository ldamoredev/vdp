import { CreateLoanData, Loan } from './Loan';

export abstract class LoanRepository {
    abstract createLoan(userId: string, data: CreateLoanData): Promise<Loan>;
    abstract listLoans(userId: string): Promise<Loan[]>;
    abstract getLoan(userId: string, id: string): Promise<Loan | null>;
    /** Persists status/dueDate/note/updatedAt and appends any newly registered payments (append-only). */
    abstract save(userId: string, loan: Loan): Promise<Loan>;
}
