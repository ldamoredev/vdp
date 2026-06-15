import { describe, expect, it, vi } from "vitest";

import { Core } from "../../../Core";
import { Investment } from "../../../domain/wallet/Investment";
import { SavingsGoal } from "../../../domain/wallet/SavingsGoal";
import { Transaction } from "../../../domain/wallet/Transaction";
import { ContributeSavings } from "../ContributeSavings";
import { CreateAccount } from "../CreateAccount";
import { CreateCategory } from "../CreateCategory";
import { CreateExchangeRate } from "../CreateExchangeRate";
import { CreateInvestment } from "../CreateInvestment";
import { CreateSavingsGoal } from "../CreateSavingsGoal";
import { CreateTransaction } from "../CreateTransaction";
import { DeleteAccount } from "../DeleteAccount";
import { DeleteTransaction } from "../DeleteTransaction";
import { GetAccounts } from "../GetAccounts";
import { GetCategories } from "../GetCategories";
import { GetExchangeRates } from "../GetExchangeRates";
import { GetInvestments } from "../GetInvestments";
import { GetSavings } from "../GetSavings";
import { GetTransactions } from "../GetTransactions";
import { GetWalletMonthlyTrend } from "../GetWalletMonthlyTrend";
import { GetWalletStatsByCategory } from "../GetWalletStatsByCategory";
import { GetWalletStatsSummary } from "../GetWalletStatsSummary";
import { UpdateAccount } from "../UpdateAccount";
import { UpdateInvestment } from "../UpdateInvestment";
import { UpdateSavingsGoal } from "../UpdateSavingsGoal";
import { UpdateTransaction } from "../UpdateTransaction";
import { WalletModule } from "../WalletModule";
import { FakeWalletGateway } from "./fakes/FakeWalletGateway";

function coreWith(gateway: FakeWalletGateway): Core {
  return new Core({
    httpClient: {} as never,
    loggingSink: { debug: vi.fn(), error: vi.fn() },
  }).use(new WalletModule(gateway));
}

describe("wallet handlers (dispatched through the bus)", () => {
  describe("accounts", () => {
    it("GetAccounts returns the list", async () => {
      const gateway = new FakeWalletGateway();
      const accounts = await coreWith(gateway).execute(new GetAccounts());
      expect(gateway.callsTo("getAccounts")).toHaveLength(1);
      expect(accounts[0].id).toBe("a1");
    });

    it("CreateAccount / UpdateAccount / DeleteAccount forward args", async () => {
      const gateway = new FakeWalletGateway();
      const core = coreWith(gateway);
      const input = { name: "Banco", currency: "ARS" as const, type: "bank" as const, initialBalance: "0" };
      await core.execute(new CreateAccount(input));
      await core.execute(new UpdateAccount("a1", { name: "Banco 2" }));
      await core.execute(new DeleteAccount("a1"));
      expect(gateway.callsTo("createAccount")[0].args).toEqual([input]);
      expect(gateway.callsTo("updateAccount")[0].args).toEqual(["a1", { name: "Banco 2" }]);
      expect(gateway.callsTo("deleteAccount")[0].args).toEqual(["a1"]);
    });
  });

  describe("categories", () => {
    it("GetCategories forwards the type filter; CreateCategory forwards input", async () => {
      const gateway = new FakeWalletGateway();
      const core = coreWith(gateway);
      await core.execute(new GetCategories("expense"));
      await core.execute(new CreateCategory({ name: "Comida", type: "expense", icon: "🍔" }));
      expect(gateway.callsTo("getCategories")[0].args).toEqual(["expense"]);
      expect(gateway.callsTo("createCategory")[0].args).toEqual([
        { name: "Comida", type: "expense", icon: "🍔" },
      ]);
    });
  });

  describe("transactions", () => {
    it("GetTransactions forwards params and maps to domain models", async () => {
      const gateway = new FakeWalletGateway();
      const result = await coreWith(gateway).execute(
        new GetTransactions({ limit: "20", offset: "0", type: "expense" }),
      );
      expect(gateway.callsTo("getTransactions")[0].args).toEqual([
        { limit: "20", offset: "0", type: "expense" },
      ]);
      expect(result.transactions[0]).toBeInstanceOf(Transaction);
      expect(result.total).toBe(1);
    });

    it("Create / Update / Delete forward args and return a model", async () => {
      const gateway = new FakeWalletGateway();
      const core = coreWith(gateway);
      const input = { accountId: "a1", type: "expense" as const, amount: "100", currency: "ARS" as const };
      const created = await core.execute(new CreateTransaction(input));
      await core.execute(new UpdateTransaction("tx1", { amount: "200" }));
      await core.execute(new DeleteTransaction("tx1"));
      expect(created).toBeInstanceOf(Transaction);
      expect(gateway.callsTo("createTransaction")[0].args).toEqual([input]);
      expect(gateway.callsTo("updateTransaction")[0].args).toEqual(["tx1", { amount: "200" }]);
      expect(gateway.callsTo("deleteTransaction")[0].args).toEqual(["tx1"]);
    });
  });

  describe("savings", () => {
    it("Get / Create / Update / Contribute forward args and map to models", async () => {
      const gateway = new FakeWalletGateway();
      const core = coreWith(gateway);
      const list = await core.execute(new GetSavings());
      await core.execute(
        new CreateSavingsGoal({ name: "Viaje", targetAmount: "1000", currency: "ARS", deadline: null }),
      );
      await core.execute(new UpdateSavingsGoal("s1", { name: "Viaje 2" }));
      const contributed = await core.execute(new ContributeSavings("s1", { amount: "250" }));
      expect(list[0]).toBeInstanceOf(SavingsGoal);
      expect(contributed).toBeInstanceOf(SavingsGoal);
      expect(gateway.callsTo("updateSavingsGoal")[0].args).toEqual(["s1", { name: "Viaje 2" }]);
      expect(gateway.callsTo("contributeSavings")[0].args).toEqual(["s1", { amount: "250" }]);
    });
  });

  describe("investments", () => {
    it("Get / Create / Update forward args and map to models", async () => {
      const gateway = new FakeWalletGateway();
      const core = coreWith(gateway);
      const list = await core.execute(new GetInvestments());
      const input = {
        name: "Plazo",
        type: "plazo_fijo" as const,
        currency: "ARS" as const,
        investedAmount: "1000",
        currentValue: "1100",
        startDate: "2026-01-01",
      };
      const created = await core.execute(new CreateInvestment(input));
      await core.execute(new UpdateInvestment("i1", { currentValue: "1200" }));
      expect(list[0]).toBeInstanceOf(Investment);
      expect(created).toBeInstanceOf(Investment);
      expect(gateway.callsTo("createInvestment")[0].args).toEqual([input]);
      expect(gateway.callsTo("updateInvestment")[0].args).toEqual(["i1", { currentValue: "1200" }]);
    });
  });

  describe("stats & exchange rates", () => {
    it("forwards stats params and routes the read queries", async () => {
      const gateway = new FakeWalletGateway();
      const core = coreWith(gateway);
      await core.execute(new GetWalletStatsSummary({ from: "2026-06-01" }));
      await core.execute(new GetWalletStatsByCategory({ type: "expense" }));
      await core.execute(new GetWalletMonthlyTrend());
      await core.execute(new GetExchangeRates());
      await core.execute(
        new CreateExchangeRate({ fromCurrency: "USD", toCurrency: "ARS", rate: "1000", type: "blue" }),
      );
      expect(gateway.callsTo("getStatsSummary")[0].args).toEqual([{ from: "2026-06-01" }]);
      expect(gateway.callsTo("getStatsByCategory")[0].args).toEqual([{ type: "expense" }]);
      expect(gateway.callsTo("getMonthlyTrend")).toHaveLength(1);
      expect(gateway.callsTo("getExchangeRates")).toHaveLength(1);
      expect(gateway.callsTo("createExchangeRate")[0].args).toEqual([
        { fromCurrency: "USD", toCurrency: "ARS", rate: "1000", type: "blue" },
      ]);
    });
  });
});
