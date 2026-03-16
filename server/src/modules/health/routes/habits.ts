import { FastifyInstance } from "fastify";
import {
  createHabitSchema,
  updateHabitSchema,
  habitFiltersSchema,
  completeHabitSchema,
  completionFiltersSchema,
} from "@vdp/shared";
import { healthService } from "../service.js";

export async function habitsRoutes(app: FastifyInstance) {
  app.get("/api/v1/health/habits", async (request, reply) => {
    try {
      const parsed = habitFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await healthService.listHabits(parsed.data.includeInactive);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/v1/health/habits", async (request, reply) => {
    try {
      const parsed = createHabitSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const habit = await healthService.createHabit(parsed.data);
      return reply.status(201).send(habit);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create habit" });
    }
  });

  app.put<{ Params: { id: string } }>("/api/v1/health/habits/:id", async (request, reply) => {
    try {
      const parsed = updateHabitSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await healthService.updateHabit(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Habit not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update habit" });
    }
  });

  app.delete<{ Params: { id: string } }>("/api/v1/health/habits/:id", async (request, reply) => {
    try {
      const updated = await healthService.deactivateHabit(request.params.id);
      if (!updated) return reply.status(404).send({ error: "Habit not found" });
      return reply.send({ message: "Habit deactivated" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete habit" });
    }
  });

  // ─── Completions ────────────────────────────────────────

  app.get<{ Params: { id: string } }>("/api/v1/health/habits/:id/completions", async (request, reply) => {
    try {
      const parsed = completionFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await healthService.listCompletions(request.params.id, parsed.data.from);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch completions" });
    }
  });

  app.post<{ Params: { id: string } }>("/api/v1/health/habits/:id/complete", async (request, reply) => {
    try {
      const parsed = completeHabitSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const completion = await healthService.completeHabit(request.params.id, parsed.data);
      return reply.status(201).send(completion);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to complete habit" });
    }
  });
}
