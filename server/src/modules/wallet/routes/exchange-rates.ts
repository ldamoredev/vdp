// export async function exchangeRatesRoutes(app: FastifyInstance) {
//   app.get("/api/v1/exchange-rates/latest", async (_request, reply) => {
//     try {
//       const result = await walletService.getLatestRates();
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch exchange rates" });
//     }
//   });
//
//   app.post("/api/v1/exchange-rates", async (request, reply) => {
//     try {
//       const parsed = createExchangeRateSchema.safeParse(request.body);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const rate = await walletService.upsertExchangeRate(parsed.data);
//       return reply.status(201).send(rate);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to create/update exchange rate" });
//     }
//   });
// }
