import { FastifyInstance } from "fastify";
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentFiltersSchema,
} from "@vdp/shared";
import { healthService } from "../service.js";

export async function appointmentsRoutes(app: FastifyInstance) {
  app.get("/api/v1/health/appointments", async (request, reply) => {
    try {
      const parsed = appointmentFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await healthService.listAppointments(parsed.data.status);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch appointments" });
    }
  });

  app.get<{ Params: { id: string } }>("/api/v1/health/appointments/:id", async (request, reply) => {
    try {
      const result = await healthService.getAppointment(request.params.id);
      if (!result) return reply.status(404).send({ error: "Appointment not found" });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch appointment" });
    }
  });

  app.post("/api/v1/health/appointments", async (request, reply) => {
    try {
      const parsed = createAppointmentSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const apt = await healthService.createAppointment(parsed.data);
      return reply.status(201).send(apt);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create appointment" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/health/appointments/:id", async (request, reply) => {
    try {
      const parsed = updateAppointmentSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await healthService.updateAppointment(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Appointment not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update appointment" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/health/appointments/:id", async (request, reply) => {
    try {
      const deleted = await healthService.deleteAppointment(request.params.id);
      if (!deleted) return reply.status(404).send({ error: "Appointment not found" });
      return reply.send({ message: "Appointment deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete appointment" });
    }
  });
}
