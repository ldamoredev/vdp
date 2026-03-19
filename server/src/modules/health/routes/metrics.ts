
// export async function metricsRoutes(app: FastifyInstance) {
//   app.get("/api/v1/health/metrics", async (request, reply) => {
//     try {
//       const parsed = metricFiltersSchema.safeParse(request.query);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const result = await healthService.listMetrics(parsed.data);
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch metrics" });
//     }
//   });
//
//   app.post("/api/v1/health/metrics", async (request, reply) => {
//     try {
//       const parsed = createMetricSchema.safeParse(request.body);
//       if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
//       const metric = await healthService.createMetric(parsed.data);
//       return reply.status(201).send(metric);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to log metric" });
//     }
//   });
//
//   app.delete<{ Params: { id: string } }>("/api/v1/health/metrics/:id", async (request, reply) => {
//     try {
//       const deleted = await healthService.deleteMetric(request.params.id);
//       if (!deleted) return reply.status(404).send({ error: "Metric not found" });
//       return reply.send({ message: "Metric deleted" });
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to delete metric" });
//     }
//   });
//
//   app.get("/api/v1/health/today", async (_request, reply) => {
//     try {
//       const result = await healthService.getTodaySummary();
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch today's summary" });
//     }
//   });
//
//   app.get("/api/v1/health/stats/weekly", async (_request, reply) => {
//     try {
//       const result = await healthService.getWeeklyStats();
//       return reply.send(result);
//     } catch (err) {
//       app.log.error(err);
//       return reply.status(500).send({ error: "Failed to fetch weekly stats" });
//     }
//   });
// }
