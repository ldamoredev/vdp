import { FastifyInstance } from "fastify";
import {
  createMedicationSchema,
  updateMedicationSchema,
  medicationFiltersSchema,
  logMedicationSchema,
  medicationLogFiltersSchema,
} from "@vdp/shared";
import { healthService } from "../service.js";

export async function medicationsRoutes(app: FastifyInstance) {
  app.get("/api/v1/health/medications", async (request, reply) => {
    try {
      const parsed = medicationFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await healthService.listMedications(parsed.data.includeInactive);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch medications" });
    }
  });

  app.post("/api/v1/health/medications", async (request, reply) => {
    try {
      const parsed = createMedicationSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const med = await healthService.createMedication(parsed.data);
      return reply.status(201).send(med);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create medication" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/health/medications/:id", async (request, reply) => {
    try {
      const parsed = updateMedicationSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await healthService.updateMedication(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Medication not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update medication" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/health/medications/:id", async (request, reply) => {
    try {
      const updated = await healthService.deactivateMedication(request.params.id);
      if (!updated) return reply.status(404).send({ error: "Medication not found" });
      return reply.send({ message: "Medication deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete medication" });
    }
  });

  // ─── Medication Logs ────────────────────────────────────

  app.get<{ Params: { id: string } }>("/api/v1/health/medications/:id/logs", async (request, reply) => {
    try {
      const parsed = medicationLogFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await healthService.listMedicationLogs(request.params.id, parsed.data);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch medication logs" });
    }
  });

  app.post<{ Params: { id: string } }>("/api/v1/health/medications/:id/log", async (request, reply) => {
    try {
      const parsed = logMedicationSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const log = await healthService.logMedication(request.params.id, parsed.data);
      return reply.status(201).send(log);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to log medication" });
    }
  });
}
