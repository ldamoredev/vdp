import type { AgentTool } from "../../../agents/base-agent.js";
import { tasksService } from "../service.js";

export function createTasksTools(): AgentTool[] {
  return [
    // ─── CRUD ──────────────────────────────────────────────
    {
      name: "create_task",
      description: "Create a new task for today (or a specific date). Returns the created task.",
      inputSchema: {
        type: "object" as const,
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Optional description" },
          priority: {
            type: "number",
            enum: [1, 2, 3],
            description: "Priority: 1=low, 2=medium, 3=high. Default: 2",
          },
          scheduledDate: {
            type: "string",
            description: "Date (YYYY-MM-DD). Defaults to today.",
          },
          domain: {
            type: "string",
            enum: ["wallet", "health", "work", "people", "study"],
            description: "Optional domain tag",
          },
        },
        required: ["title"],
      },
      execute: async (input) => {
        const task = await tasksService.createTask({
          title: input.title,
          description: input.description,
          priority: input.priority,
          scheduledDate: input.scheduledDate,
          domain: input.domain,
        });
        return JSON.stringify(task);
      },
    },
    {
      name: "list_tasks",
      description:
        "List tasks filtered by date, status, domain, or priority. Defaults to today's pending tasks.",
      inputSchema: {
        type: "object" as const,
        properties: {
          scheduledDate: {
            type: "string",
            description: "Date filter (YYYY-MM-DD). Default: today.",
          },
          status: {
            type: "string",
            enum: ["pending", "done", "carried_over", "discarded"],
          },
          domain: {
            type: "string",
            enum: ["wallet", "health", "work", "people", "study"],
          },
          priority: { type: "number", enum: [1, 2, 3] },
        },
        required: [],
      },
      execute: async (input) => {
        const result = await tasksService.listTasks({
          scheduledDate: input.scheduledDate || new Date().toISOString().slice(0, 10),
          status: input.status,
          domain: input.domain,
          priority: input.priority,
        });
        return JSON.stringify(result);
      },
    },
    {
      name: "get_task",
      description: "Get a task by ID with its notes.",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
        },
        required: ["taskId"],
      },
      execute: async (input) => {
        const task = await tasksService.getTaskWithNotes(input.taskId);
        return JSON.stringify(task || { error: "Task not found" });
      },
    },
    {
      name: "update_task",
      description: "Update a task's title, description, priority, date, or domain.",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "number", enum: [1, 2, 3] },
          scheduledDate: { type: "string" },
          domain: {
            type: "string",
            enum: ["wallet", "health", "work", "people", "study"],
          },
        },
        required: ["taskId"],
      },
      execute: async (input) => {
        const { taskId, ...data } = input;
        const updated = await tasksService.updateTask(taskId, data);
        return JSON.stringify(updated || { error: "Task not found" });
      },
    },
    {
      name: "delete_task",
      description: "Permanently delete a task.",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
        },
        required: ["taskId"],
      },
      execute: async (input) => {
        const deleted = await tasksService.deleteTask(input.taskId);
        return JSON.stringify(deleted ? { message: "Task deleted" } : { error: "Task not found" });
      },
    },

    // ─── Status Transitions ────────────────────────────────
    {
      name: "complete_task",
      description: "Mark a task as done.",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
        },
        required: ["taskId"],
      },
      execute: async (input) => {
        const completed = await tasksService.completeTask(input.taskId);
        return JSON.stringify(completed || { error: "Task not found" });
      },
    },
    {
      name: "carry_over_task",
      description:
        "Move a pending task to another day (default: tomorrow). Increments carry-over counter.",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
          toDate: { type: "string", description: "Target date (YYYY-MM-DD). Default: tomorrow." },
        },
        required: ["taskId"],
      },
      execute: async (input) => {
        const carried = await tasksService.carryOverTask(input.taskId, input.toDate);
        return JSON.stringify(carried || { error: "Task not found" });
      },
    },
    {
      name: "discard_task",
      description: "Discard a task (won't be carried over).",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
        },
        required: ["taskId"],
      },
      execute: async (input) => {
        const discarded = await tasksService.discardTask(input.taskId);
        return JSON.stringify(discarded || { error: "Task not found" });
      },
    },

    // ─── Notes ─────────────────────────────────────────────
    {
      name: "add_task_note",
      description: "Add a note to a task.",
      inputSchema: {
        type: "object" as const,
        properties: {
          taskId: { type: "string", description: "Task ID" },
          content: { type: "string", description: "Note content" },
        },
        required: ["taskId", "content"],
      },
      execute: async (input) => {
        const note = await tasksService.addNote(input.taskId, input.content);
        return JSON.stringify(note);
      },
    },

    // ─── Daily Review & Stats ──────────────────────────────
    {
      name: "get_end_of_day_review",
      description:
        "Get end-of-day review: completed, pending, completion rate. Shows pending tasks for carry-over/discard.",
      inputSchema: {
        type: "object" as const,
        properties: {
          date: { type: "string", description: "Date (YYYY-MM-DD). Default: today." },
        },
        required: [],
      },
      execute: async (input) => {
        const result = await tasksService.getEndOfDayReview(input.date);
        return JSON.stringify(result);
      },
    },
    {
      name: "carry_over_all_pending",
      description: "Carry over ALL pending tasks from a date to tomorrow (or another date).",
      inputSchema: {
        type: "object" as const,
        properties: {
          fromDate: { type: "string", description: "Source date (YYYY-MM-DD)" },
          toDate: { type: "string", description: "Target date (YYYY-MM-DD). Default: tomorrow." },
        },
        required: ["fromDate"],
      },
      execute: async (input) => {
        const results = await tasksService.carryOverAllPending(input.fromDate, input.toDate);
        return JSON.stringify({ carriedOver: results.length, tasks: results });
      },
    },
    {
      name: "get_today_stats",
      description: "Get today's task stats: completed, pending, completion rate.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
      execute: async () => {
        const result = await tasksService.getTodayStats();
        return JSON.stringify(result);
      },
    },
    {
      name: "get_completion_trend",
      description: "Get daily completion rates for the last N days (default 7).",
      inputSchema: {
        type: "object" as const,
        properties: {
          days: { type: "number", description: "Number of days (default 7, max 90)" },
        },
        required: [],
      },
      execute: async (input) => {
        const result = await tasksService.getCompletionTrend(input.days || 7);
        return JSON.stringify(result);
      },
    },
  ];
}
