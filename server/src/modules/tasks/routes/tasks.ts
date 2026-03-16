import { FastifyInstance } from "fastify";
import {
  createTaskSchema,
  updateTaskSchema,
  taskFiltersSchema,
  createTaskNoteSchema,
  carryOverSchema,
  carryOverAllSchema,
} from "@vdp/shared";
import { tasksService } from "../service.js";

export async function tasksRoutes(app: FastifyInstance) {
  // List tasks (filtered)
  app.get("/api/v1/tasks", async (request, reply) => {
    try {
      const parsed = taskFiltersSchema.safeParse(request.query);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const result = await tasksService.listTasks(parsed.data);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch tasks" });
    }
  });

  // Get single task with notes
  app.get<{ Params: { id: string } }>("/api/v1/tasks/:id", async (request, reply) => {
    try {
      const result = await tasksService.getTaskWithNotes(request.params.id);
      if (!result) return reply.status(404).send({ error: "Task not found" });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch task" });
    }
  });

  // Create task
  app.post("/api/v1/tasks", async (request, reply) => {
    try {
      const parsed = createTaskSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const task = await tasksService.createTask(parsed.data);
      return reply.status(201).send(task);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to create task" });
    }
  });

  // Update task
  app.put<{ Params: { id: string } }>("/api/v1/tasks/:id", async (request, reply) => {
    try {
      const parsed = updateTaskSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const updated = await tasksService.updateTask(request.params.id, parsed.data);
      if (!updated) return reply.status(404).send({ error: "Task not found" });
      return reply.send(updated);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to update task" });
    }
  });

  // Delete task
  app.delete<{ Params: { id: string } }>("/api/v1/tasks/:id", async (request, reply) => {
    try {
      const deleted = await tasksService.deleteTask(request.params.id);
      if (!deleted) return reply.status(404).send({ error: "Task not found" });
      return reply.send({ message: "Task deleted" });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to delete task" });
    }
  });

  // ─── Status Transitions ──────────────────────────────────

  // Complete a task
  app.post<{ Params: { id: string } }>("/api/v1/tasks/:id/complete", async (request, reply) => {
    try {
      const completed = await tasksService.completeTask(request.params.id);
      if (!completed) return reply.status(404).send({ error: "Task not found" });
      return reply.send(completed);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to complete task" });
    }
  });

  // Carry over a task to another day
  app.post<{ Params: { id: string } }>("/api/v1/tasks/:id/carry-over", async (request, reply) => {
    try {
      const parsed = carryOverSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const carried = await tasksService.carryOverTask(request.params.id, parsed.data.toDate);
      if (!carried) return reply.status(404).send({ error: "Task not found" });
      return reply.send(carried);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to carry over task" });
    }
  });

  // Discard a task
  app.post<{ Params: { id: string } }>("/api/v1/tasks/:id/discard", async (request, reply) => {
    try {
      const discarded = await tasksService.discardTask(request.params.id);
      if (!discarded) return reply.status(404).send({ error: "Task not found" });
      return reply.send(discarded);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to discard task" });
    }
  });

  // Carry over all pending tasks from a date
  app.post("/api/v1/tasks/carry-over-all", async (request, reply) => {
    try {
      const parsed = carryOverAllSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const results = await tasksService.carryOverAllPending(
        parsed.data.fromDate,
        parsed.data.toDate
      );
      return reply.send({ carriedOver: results.length, tasks: results });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to carry over tasks" });
    }
  });

  // End-of-day review
  app.get("/api/v1/tasks/review", async (request, reply) => {
    try {
      const { date } = request.query as { date?: string };
      const result = await tasksService.getEndOfDayReview(date);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to get review" });
    }
  });

  // ─── Task Notes ──────────────────────────────────────────

  app.get<{ Params: { id: string } }>("/api/v1/tasks/:id/notes", async (request, reply) => {
    try {
      const notes = await tasksService.listNotes(request.params.id);
      return reply.send(notes);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch notes" });
    }
  });

  app.post<{ Params: { id: string } }>("/api/v1/tasks/:id/notes", async (request, reply) => {
    try {
      const parsed = createTaskNoteSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });
      const note = await tasksService.addNote(request.params.id, parsed.data.content);
      return reply.status(201).send(note);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Failed to add note" });
    }
  });
}
