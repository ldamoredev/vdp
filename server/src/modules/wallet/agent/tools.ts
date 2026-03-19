// export function createWalletTools(): AgentTool[] {
//   return [
//     {
//       name: "list_transactions",
//       description:
//         "Search and list transactions. Can filter by account, category, type, date range, and search text.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           accountId: { type: "string", description: "Filter by account ID" },
//           categoryId: { type: "string", description: "Filter by category ID" },
//           type: {
//             type: "string",
//             enum: ["income", "expense", "transfer"],
//             description: "Filter by transaction type",
//           },
//           from: { type: "string", description: "Start date (YYYY-MM-DD)" },
//           to: { type: "string", description: "End date (YYYY-MM-DD)" },
//           search: { type: "string", description: "Search in description" },
//           limit: { type: "number", description: "Max results (default 10)" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await walletService.listTransactions({
//           ...input,
//           limit: input.limit || 10,
//         });
//         return JSON.stringify(result.data);
//       },
//     },
//     {
//       name: "create_transaction",
//       description:
//         "Create a new transaction (income, expense, or transfer). Returns the created transaction.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           accountId: {
//             type: "string",
//             description: "Account ID. If not provided, will use first account matching currency.",
//           },
//           categoryId: {
//             type: "string",
//             description: "Category ID (optional for transfers)",
//           },
//           type: { type: "string", enum: ["income", "expense", "transfer"] },
//           amount: { type: "string", description: "Amount as string (e.g., '5000.00')" },
//           currency: {
//             type: "string",
//             enum: ["ARS", "USD"],
//             description: "Currency code. Defaults to ARS.",
//           },
//           description: { type: "string", description: "Transaction description" },
//           date: { type: "string", description: "Date (YYYY-MM-DD). Defaults to today." },
//           tags: {
//             type: "array",
//             items: { type: "string" },
//             description: "Tags for the transaction",
//           },
//         },
//         required: ["type", "amount"],
//       },
//       execute: async (input) => {
//         const tx = await walletService.createTransaction({
//           accountId: input.accountId,
//           categoryId: input.categoryId,
//           type: input.type,
//           amount: input.amount,
//           currency: input.currency,
//           description: input.description,
//           date: input.date,
//           tags: input.tags,
//         });
//         return JSON.stringify(tx);
//       },
//     },
//     {
//       name: "get_accounts_with_balances",
//       description: "Get all accounts with their current balances.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {},
//         required: [],
//       },
//       execute: async () => {
//         const result = await walletService.getAccountsWithBalances();
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "list_categories",
//       description: "List available transaction categories.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           type: {
//             type: "string",
//             enum: ["income", "expense"],
//             description: "Filter by category type",
//           },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await walletService.listCategories(input.type);
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "get_spending_by_category",
//       description: "Get spending breakdown by category for a date range.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           from: { type: "string", description: "Start date (YYYY-MM-DD)" },
//           to: { type: "string", description: "End date (YYYY-MM-DD)" },
//           currency: { type: "string", enum: ["ARS", "USD"] },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await walletService.getSpendingByCategory(input);
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "get_monthly_summary",
//       description: "Get income, expenses, and net for a given month/year.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           month: { type: "number", description: "Month (1-12)" },
//           year: { type: "number", description: "Year (e.g., 2026)" },
//         },
//         required: [],
//       },
//       execute: async (input) => {
//         const result = await walletService.getMonthlySummary(input.month, input.year);
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "get_savings_goals",
//       description: "List savings goals with their progress.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {},
//         required: [],
//       },
//       execute: async () => {
//         const result = await walletService.listSavingsGoals();
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "contribute_to_savings",
//       description: "Add a contribution to a savings goal.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           goalId: { type: "string", description: "Savings goal ID" },
//           amount: { type: "string", description: "Amount to contribute" },
//           date: { type: "string", description: "Date (YYYY-MM-DD)" },
//           note: { type: "string", description: "Optional note" },
//         },
//         required: ["goalId", "amount"],
//       },
//       execute: async (input) => {
//         const result = await walletService.contributeToSavings(input.goalId, {
//           amount: input.amount,
//           date: input.date,
//           note: input.note,
//         });
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "get_investments_summary",
//       description: "Get investment portfolio overview.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {},
//         required: [],
//       },
//       execute: async () => {
//         const result = await walletService.listInvestments();
//         return JSON.stringify(result);
//       },
//     },
//     {
//       name: "update_exchange_rate",
//       description: "Set the current exchange rate between currencies.",
//       inputSchema: {
//         type: "object" as const,
//         properties: {
//           fromCurrency: { type: "string", enum: ["ARS", "USD"] },
//           toCurrency: { type: "string", enum: ["ARS", "USD"] },
//           rate: { type: "string", description: "Exchange rate" },
//           type: {
//             type: "string",
//             enum: ["official", "blue", "mep", "ccl"],
//             description: "Rate type",
//           },
//         },
//         required: ["fromCurrency", "toCurrency", "rate", "type"],
//       },
//       execute: async (input) => {
//         const result = await walletService.upsertExchangeRate({
//           fromCurrency: input.fromCurrency,
//           toCurrency: input.toCurrency,
//           rate: input.rate,
//           type: input.type,
//           date: new Date().toISOString().slice(0, 10),
//         });
//         return JSON.stringify(result);
//       },
//     },
//   ];
// }
