import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { Category } from "../../domain/wallet/Category";
import type { CreateCategoryInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateCategory extends Command<Category> {
  constructor(readonly input: CreateCategoryInput) {
    super();
  }
}

export class CreateCategoryHandler implements RequestHandler<CreateCategory, Category> {
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateCategory): Promise<Category> {
    return this.gateway.createCategory(command.input);
  }
}
