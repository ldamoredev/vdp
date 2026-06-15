import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { ExchangeRate } from "../../domain/wallet/ExchangeRate";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetExchangeRates extends Query<ExchangeRate[]> {}

export class GetExchangeRatesHandler implements RequestHandler<GetExchangeRates, ExchangeRate[]> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(): Promise<ExchangeRate[]> {
    return this.gateway.getExchangeRates();
  }
}
