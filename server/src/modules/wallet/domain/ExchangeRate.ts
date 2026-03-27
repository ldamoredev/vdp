export type ExchangeRate = {
    readonly id: string;
    readonly fromCurrency: string;
    readonly toCurrency: string;
    readonly rate: string;
    readonly type: string;
    readonly date: string;
    readonly createdAt: Date;
};

export type CreateExchangeRateData = {
    readonly fromCurrency: string;
    readonly toCurrency: string;
    readonly rate: string;
    readonly type: string;
    readonly date: string;
};
