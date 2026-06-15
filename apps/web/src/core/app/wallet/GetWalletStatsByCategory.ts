import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { WalletGateway } from "../../domain/wallet/WalletGateway";
import type { CategoryStat } from "../../domain/wallet/WalletStats";

export class GetWalletStatsByCategory extends Query<CategoryStat[]> {
  constructor(readonly params?: Record<string, string>) {
    super();
  }
}

export class GetWalletStatsByCategoryHandler
  implements RequestHandler<GetWalletStatsByCategory, CategoryStat[]>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(query: GetWalletStatsByCategory): Promise<CategoryStat[]> {
    return this.gateway.getStatsByCategory(query.params);
  }
}
