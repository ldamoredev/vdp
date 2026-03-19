// export async function transactionsRoutes(app: FastifyInstance) {
//   app.get("/api/v1/transactions", async (request, reply) => {
//     try {
//       const parsed = transactionFiltersSchema.safeParse(request.query);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const result = await walletService.listTransactions(parsed.data);
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch transactions" });
//     }
//   });
//
//   app.get<{ Params: { id: string } }>("/api/v1/transactions/:id", async (request, reply) => {
//     try {
//       const result = await walletService.getTransaction(request.params.id);
//       if (!result) return reply.status(404).send({ error: "Transaction not found" });
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch transaction" });
//     }
//   });
//
//   app.post("/api/v1/transactions", async (request, reply) => {
//     try {
//       const parsed = createTransactionSchema.safeParse(request.body);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const transaction = await walletService.createTransaction(parsed.data);
//       return reply.status(201).send(transaction);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to create transaction" });
//     }
//   });
//
//   app.put<{ Params: { id: string } }>("/api/v1/transactions/:id", async (request, reply) => {
//     try {
//       const parsed = updateTransactionSchema.safeParse(request.body);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const updated = await walletService.updateTransaction(request.params.id, parsed.data);
//       if (!updated) return reply.status(404).send({ error: "Transaction not found" });
//       return reply.send(updated);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to update transaction" });
//     }
//   });
//
//   app.delete<{ Params: { id: string } }>("/api/v1/transactions/:id", async (request, reply) => {
//     try {
//       const deleted = await walletService.deleteTransaction(request.params.id);
//       if (!deleted) return reply.status(404).send({ error: "Transaction not found" });
//       return reply.send({ message: "Transaction deleted" });
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to delete transaction" });
//     }
//   });
// }
