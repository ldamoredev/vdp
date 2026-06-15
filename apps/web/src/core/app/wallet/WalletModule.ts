import type { Core, CoreModule } from "../../Core";
import type { WalletGateway } from "../../domain/wallet/WalletGateway";
import { HttpWalletGateway } from "../../infrastructure/http/HttpWalletGateway";

import { ContributeSavings, ContributeSavingsHandler } from "./ContributeSavings";
import { CreateAccount, CreateAccountHandler } from "./CreateAccount";
import { CreateCategory, CreateCategoryHandler } from "./CreateCategory";
import { CreateExchangeRate, CreateExchangeRateHandler } from "./CreateExchangeRate";
import { CreateInvestment, CreateInvestmentHandler } from "./CreateInvestment";
import { CreateSavingsGoal, CreateSavingsGoalHandler } from "./CreateSavingsGoal";
import { CreateTransaction, CreateTransactionHandler } from "./CreateTransaction";
import { DeleteAccount, DeleteAccountHandler } from "./DeleteAccount";
import { DeleteTransaction, DeleteTransactionHandler } from "./DeleteTransaction";
import { GetAccounts, GetAccountsHandler } from "./GetAccounts";
import { GetCategories, GetCategoriesHandler } from "./GetCategories";
import { GetExchangeRates, GetExchangeRatesHandler } from "./GetExchangeRates";
import { GetInvestments, GetInvestmentsHandler } from "./GetInvestments";
import { GetSavings, GetSavingsHandler } from "./GetSavings";
import { GetTransactions, GetTransactionsHandler } from "./GetTransactions";
import { GetWalletMonthlyTrend, GetWalletMonthlyTrendHandler } from "./GetWalletMonthlyTrend";
import { GetWalletStatsByCategory, GetWalletStatsByCategoryHandler } from "./GetWalletStatsByCategory";
import { GetWalletStatsSummary, GetWalletStatsSummaryHandler } from "./GetWalletStatsSummary";
import { UpdateAccount, UpdateAccountHandler } from "./UpdateAccount";
import { UpdateInvestment, UpdateInvestmentHandler } from "./UpdateInvestment";
import { UpdateSavingsGoal, UpdateSavingsGoalHandler } from "./UpdateSavingsGoal";
import { UpdateTransaction, UpdateTransactionHandler } from "./UpdateTransaction";

/**
 * Wires the wallet module into the Core: builds the gateway from the shared HTTP
 * client and registers every command/query handler on the bus. Frontend
 * analogue of the backend's WalletModuleRuntime. Accepts an injected gateway for
 * tests.
 */
export class WalletModule implements CoreModule {
  constructor(private readonly gateway?: WalletGateway) {}

  register(core: Core): void {
    const gateway = this.gateway ?? new HttpWalletGateway(core.httpClient);

    // accounts
    core.bus.registerHandler(GetAccounts, () => new GetAccountsHandler(gateway));
    core.bus.registerHandler(CreateAccount, () => new CreateAccountHandler(gateway));
    core.bus.registerHandler(UpdateAccount, () => new UpdateAccountHandler(gateway));
    core.bus.registerHandler(DeleteAccount, () => new DeleteAccountHandler(gateway));

    // categories
    core.bus.registerHandler(GetCategories, () => new GetCategoriesHandler(gateway));
    core.bus.registerHandler(CreateCategory, () => new CreateCategoryHandler(gateway));

    // transactions
    core.bus.registerHandler(GetTransactions, () => new GetTransactionsHandler(gateway));
    core.bus.registerHandler(CreateTransaction, () => new CreateTransactionHandler(gateway));
    core.bus.registerHandler(UpdateTransaction, () => new UpdateTransactionHandler(gateway));
    core.bus.registerHandler(DeleteTransaction, () => new DeleteTransactionHandler(gateway));

    // savings
    core.bus.registerHandler(GetSavings, () => new GetSavingsHandler(gateway));
    core.bus.registerHandler(CreateSavingsGoal, () => new CreateSavingsGoalHandler(gateway));
    core.bus.registerHandler(UpdateSavingsGoal, () => new UpdateSavingsGoalHandler(gateway));
    core.bus.registerHandler(ContributeSavings, () => new ContributeSavingsHandler(gateway));

    // investments
    core.bus.registerHandler(GetInvestments, () => new GetInvestmentsHandler(gateway));
    core.bus.registerHandler(CreateInvestment, () => new CreateInvestmentHandler(gateway));
    core.bus.registerHandler(UpdateInvestment, () => new UpdateInvestmentHandler(gateway));

    // stats
    core.bus.registerHandler(GetWalletStatsSummary, () => new GetWalletStatsSummaryHandler(gateway));
    core.bus.registerHandler(
      GetWalletStatsByCategory,
      () => new GetWalletStatsByCategoryHandler(gateway),
    );
    core.bus.registerHandler(GetWalletMonthlyTrend, () => new GetWalletMonthlyTrendHandler(gateway));

    // exchange rates
    core.bus.registerHandler(GetExchangeRates, () => new GetExchangeRatesHandler(gateway));
    core.bus.registerHandler(CreateExchangeRate, () => new CreateExchangeRateHandler(gateway));
  }
}
