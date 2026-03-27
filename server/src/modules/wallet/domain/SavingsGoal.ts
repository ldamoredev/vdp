export type SavingsGoal = {
    readonly id: string;
    readonly name: string;
    readonly targetAmount: string;
    readonly currentAmount: string;
    readonly currency: string;
    readonly deadline: string | null;
    readonly isCompleted: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type CreateSavingsGoalData = {
    readonly name: string;
    readonly targetAmount: string;
    readonly currency: string;
    readonly deadline?: string | null;
};

export type UpdateSavingsGoalData = Partial<CreateSavingsGoalData>;

export type ContributeSavingsData = {
    readonly amount: string;
    readonly date: string;
    readonly note?: string | null;
    readonly transactionId?: string | null;
};
