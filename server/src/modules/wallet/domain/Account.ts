export type Account = {
    readonly id: string;
    readonly name: string;
    readonly currency: string;
    readonly type: string;
    readonly initialBalance: string;
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
};

export type CreateAccountData = {
    readonly name: string;
    readonly currency: string;
    readonly type: string;
    readonly initialBalance?: string;
};

export type UpdateAccountData = Partial<CreateAccountData>;
