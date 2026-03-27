export type Category = {
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly icon: string | null;
    readonly parentId: string | null;
    readonly createdAt: Date;
};

export type CreateCategoryData = {
    readonly name: string;
    readonly type: string;
    readonly icon?: string | null;
    readonly parentId?: string | null;
};

export type UpdateCategoryData = Partial<CreateCategoryData>;
