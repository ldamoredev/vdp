import { Command, RequestHandler } from "@nbottarini/cqbus";

import type { ExchangeRate } from "../../domain/wallet/ExchangeRate";
import type { CreateExchangeRateInput, WalletGateway } from "../../domain/wallet/WalletGateway";

export class CreateExchangeRate extends Command<ExchangeRate> {
  constructor(readonly input: CreateExchangeRateInput) {
    super();
  }
}

export class CreateExchangeRateHandler
  implements RequestHandler<CreateExchangeRate, ExchangeRate>
{
  constructor(private readonly gateway: WalletGateway) {}

  async handle(command: CreateExchangeRate): Promise<ExchangeRate> {
    return this.gateway.createExchangeRate(command.input);
  }
}
