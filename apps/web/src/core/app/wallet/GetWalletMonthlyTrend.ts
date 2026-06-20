import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";
import type { MonthlyTrend } from "../../domain/wallet/WalletStats";

export class GetWalletMonthlyTrend extends Query<MonthlyTrend[]> {
  constructor(readonly params?: Record<string, string>) {
    super();
  }
}

export class GetWalletMonthlyTrendHandler
  implements RequestHandler<GetWalletMonthlyTrend, MonthlyTrend[]>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(query: GetWalletMonthlyTrend): Promise<MonthlyTrend[]> {
    return this.gateway.getMonthlyTrend(query.params);
  }
}
