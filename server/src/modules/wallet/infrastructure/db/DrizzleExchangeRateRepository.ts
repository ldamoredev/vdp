import { Database } from '../../../common/base/db/Database';
import { exchangeRates } from '../../schema';
import { CreateExchangeRateData, ExchangeRate } from '../../domain/ExchangeRate';
import { ExchangeRateRepository } from '../../domain/ExchangeRateRepository';

export class DrizzleExchangeRateRepository extends ExchangeRateRepository {
    constructor(private readonly db: Database) {
        super();
    }

    async findAll(): Promise<ExchangeRate[]> {
        return this.db.query.select().from(exchangeRates);
    }

    async create(data: CreateExchangeRateData): Promise<ExchangeRate> {
        const [row] = await this.db.query
            .insert(exchangeRates)
            .values({
                fromCurrency: data.fromCurrency,
                toCurrency: data.toCurrency,
                rate: data.rate,
                type: data.type,
                date: data.date,
            })
            .returning();

        return row;
    }
}
