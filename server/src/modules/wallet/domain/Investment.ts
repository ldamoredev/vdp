export type Investment = {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly accountId: string | null;
    readonly currency: string;
    readonly investedAmount: string;
    readonly currentValue: string;
    readonly startDate: string;
    readonly endDate: string | null;
    readonly rate: string | null;
    readonly notes: string | null;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type CreateInvestmentData = {
    readonly name: string;
    readonly type: string;
    readonly accountId?: string | null;
    readonly currency: string;
    readonly investedAmount: string;
    readonly currentValue: string;
    readonly startDate: string;
    readonly endDate?: string | null;
    readonly rate?: string | null;
    readonly notes?: string | null;
};

export type UpdateInvestmentData = Partial<CreateInvestmentData>;
