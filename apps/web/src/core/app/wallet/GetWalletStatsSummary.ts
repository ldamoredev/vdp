import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";
import type { WalletStatsSummary } from "../../domain/wallet/WalletStats";

export class GetWalletStatsSummary extends Query<WalletStatsSummary> {
  constructor(readonly params?: Record<string, string>) {
    super();
  }
}

export class GetWalletStatsSummaryHandler
  implements RequestHandler<GetWalletStatsSummary, WalletStatsSummary>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(query: GetWalletStatsSummary): Promise<WalletStatsSummary> {
    return this.gateway.getStatsSummary(query.params);
  }
}
