import { HttpClient, HttpMethods, HttpRequest, HttpResponse } from "@nbottarini/abstract-http-client";
import type {
  Investment as InvestmentDto,
  SavingsGoal as SavingsGoalDto,
  Transaction as TransactionDto,
} from "@vdp/shared";
import { describe, expect, it } from "vitest";

import { Investment } from "../../../domain/wallet/Investment";
import { SavingsGoal } from "../../../domain/wallet/SavingsGoal";
import { Transaction } from "../../../domain/wallet/Transaction";
import { HttpWalletGateway } from "../HttpWalletGateway";

interface RecordedCall {
  method: HttpMethods;
  url: string;
  body: unknown;
}

class FakeHttpClient implements HttpClient {
  readonly calls: RecordedCall[] = [];
  constructor(private readonly responses: Record<string, unknown> = {}) {}

  get<T = any>(url: string) {
    return this.record<T>(HttpMethods.GET, url, undefined);
  }
  post<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.POST, url, body);
  }
  put<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PUT, url, body);
  }
  patch<T = any>(url: string, body: any) {
    return this.record<T>(HttpMethods.PATCH, url, body);
  }
  delete<T = any>(url: string) {
    return this.record<T>(HttpMethods.DELETE, url, undefined);
  }
  head<T = any>(url: string) {
    return this.record<T>(HttpMethods.HEAD, url, undefined);
  }
  send<T = any>(request: HttpRequest) {
    return this.record<T>(request.method, request.url, request.body);
  }
  addInterceptor() {}

  private async record<T>(method: HttpMethods, url: string, body: unknown): Promise<HttpResponse<T>> {
    this.calls.push({ method, url, body });
    return {
      method,
      url,
      status: 200,
      statusText: "OK",
      headers: {},
      body: (this.responses[`${method} ${url}`] ?? {}) as T,
      request: new HttpRequest(method, url, body),
    };
  }
}

function transactionDto(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: "tx1",
    accountId: "a1",
    categoryId: null,
    type: "expense",
    amount: "100",
    currency: "ARS",
    description: null,
    date: "2026-06-14",
    tags: [],
    createdAt: "2026-06-14T08:00:00.000Z",
    ...overrides,
  };
}

describe("HttpWalletGateway", () => {
  it("lists transactions, mapping DTOs to domain models and passing the total", async () => {
    const http = new FakeHttpClient({
      "GET /wallet/transactions": { transactions: [transactionDto()], total: 1, limit: 20, offset: 0 },
    });

    const result = await new HttpWalletGateway(http).getTransactions();

    expect(result.total).toBe(1);
    expect(result.transactions[0]).toBeInstanceOf(Transaction);
    expect(http.calls[0]).toMatchObject({ method: "GET", url: "/wallet/transactions" });
  });

  it("appends query params for a filtered transaction list", async () => {
    const http = new FakeHttpClient({
      "GET /wallet/transactions?limit=20&offset=0&type=expense": {
        transactions: [],
        total: 0,
        limit: 20,
        offset: 0,
      },
    });

    await new HttpWalletGateway(http).getTransactions({ limit: "20", offset: "0", type: "expense" });

    expect(http.calls[0].url).toBe("/wallet/transactions?limit=20&offset=0&type=expense");
  });

  it("maps a created transaction to a domain model", async () => {
    const http = new FakeHttpClient({ "POST /wallet/transactions": transactionDto({ id: "new" }) });

    const tx = await new HttpWalletGateway(http).createTransaction({
      accountId: "a1",
      type: "expense",
      amount: "100",
      currency: "ARS",
    });

    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.id).toBe("new");
    expect(http.calls[0]).toMatchObject({ method: "POST", url: "/wallet/transactions" });
  });

  it("returns accounts as plain wire data", async () => {
    const http = new FakeHttpClient({
      "GET /wallet/accounts": [{ id: "a1", name: "Caja", currency: "ARS" }],
    });

    const accounts = await new HttpWalletGateway(http).getAccounts();

    expect(accounts[0].id).toBe("a1");
  });

  it("filters categories by type via query param", async () => {
    const http = new FakeHttpClient({ "GET /wallet/categories?type=expense": [] });

    await new HttpWalletGateway(http).getCategories("expense");

    expect(http.calls[0].url).toBe("/wallet/categories?type=expense");
  });

  it("maps savings goals to domain models on list and contribution", async () => {
    const goal: SavingsGoalDto = {
      id: "s1",
      name: "Viaje",
      targetAmount: "1000",
      currentAmount: "250",
      currency: "ARS",
      deadline: null,
      isCompleted: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const http = new FakeHttpClient({
      "GET /wallet/savings": [goal],
      "POST /wallet/savings/s1/contribute": { ...goal, currentAmount: "500" },
    });
    const gateway = new HttpWalletGateway(http);

    const list = await gateway.getSavings();
    expect(list[0]).toBeInstanceOf(SavingsGoal);

    const updated = await gateway.contributeSavings("s1", { amount: "250" });
    expect(updated).toBeInstanceOf(SavingsGoal);
    expect(updated.current).toBe(500);
  });

  it("maps investments to domain models", async () => {
    const investment: InvestmentDto = {
      id: "i1",
      name: "Plazo",
      type: "plazo_fijo",
      accountId: null,
      currency: "ARS",
      investedAmount: "1000",
      currentValue: "1100",
      startDate: "2026-01-01",
      endDate: null,
      rate: null,
      notes: null,
      isActive: true,
    };
    const http = new FakeHttpClient({ "GET /wallet/investments": [investment] });

    const list = await new HttpWalletGateway(http).getInvestments();

    expect(list[0]).toBeInstanceOf(Investment);
    expect(list[0].invested).toBe(1000);
  });

  it("passes stats summary through and hits the latest exchange-rates path", async () => {
    const http = new FakeHttpClient({
      "GET /wallet/stats/summary": { totalIncome: "5", totalExpenses: "2", netBalance: "3", transactionCount: 4 },
      "GET /wallet/exchange-rates/latest": [],
    });
    const gateway = new HttpWalletGateway(http);

    const summary = await gateway.getStatsSummary();
    expect(summary.netBalance).toBe("3");

    await gateway.getExchangeRates();
    expect(http.calls[1].url).toBe("/wallet/exchange-rates/latest");
  });
});
