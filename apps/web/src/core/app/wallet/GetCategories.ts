import { Query, RequestHandler } from "@nbottarini/cqbus";

import type { Category, CategoryType } from "../../domain/wallet/Category";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";

export class GetCategories extends Query<Category[]> {
  constructor(readonly type?: CategoryType) {
    super();
  }
}

export class GetCategoriesHandler implements RequestHandler<GetCategories, Category[]> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(query: GetCategories): Promise<Category[]> {
    return this.gateway.getCategories(query.type);
  }
}
