import { FastifyInstance } from "fastify";
import { createBodyMeasurementSchema, bodyMeasurementFiltersSchema } from "@vdp/shared";
import { healthService } from "../service.js";

export async function bodyRoutes(app: FastifyInstance) {
  app.get("/api/v1/health/body", async (request, reply) => {
    try {
      const parsed = bodyMeasurementFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await healthService.listBodyMeasurements(parsed.data);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch measurements" });
    }
  });

  app.post("/api/v1/health/body", async (request, reply) => {
    try {
      const parsed = createBodyMeasurementSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const measurement = await healthService.createBodyMeasurement(parsed.data);
      return reply.status(201).send(measurement);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to log measurement" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/health/body/:id", async (request, reply) => {
    try {
      const deleted = await healthService.deleteBodyMeasurement(request.params.id);
      if (!deleted) return reply.status(404).send({ error: "Measurement not found" });
      return reply.send({ message: "Measurement deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete measurement" });
    }
  });
}
