import { GetTasks } from '../../services/GetTasks';
import { GetTask } from '../../services/GetTask';
import { CreateTask } from '../../services/CreateTask';
import { UpdateTask } from '../../services/UpdateTask';
import { DeleteTask } from '../../services/DeleteTask';
import { CompleteTask } from '../../services/CompleteTask';
import { CarryOverTask } from '../../services/CarryOverTask';
import { DiscardTask } from '../../services/DiscardTask';
import { AddTaskNote } from '../../services/AddTaskNote';
import { GetEndOfDayReview } from '../../services/GetEndOfDayReview';
import { CarryOverAllPending } from '../../services/CarryOverAllPending';
import { GetDayStats } from '../../services/GetDayStats';
import { AgentTool } from '../../../common/base/agents/BaseAgent';
import { ServiceProvider } from '../../../common/base/services/ServiceProvider';
import { TaskInsightsStore } from '../../services/TaskInsightsStore';
import { todayISO } from '../../../common/base/time/dates';

export class TasksTools {
  static createTasksTools(services: ServiceProvider, insightsStore?: TaskInsightsStore): AgentTool[] {
    return [
      // ─── CRUD ──────────────────────────────────────────────
      {
        name: "create_task",
        description:
          "Create a new task for today (or a specific date). Only use this after the task is clear enough to execute. " +
          "If the user message is vague, ask a follow-up first. Returns the created task.",
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
          const task = await services.get(CreateTask).execute({
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
              enum: ["pending", "done", "discarded"],
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
          const result = await services.get(GetTasks).execute({
            scheduledDate: input.scheduledDate || todayISO(),
            status: input.status,
            domain: input.domain,
            priority: input.priority,
          });
          return JSON.stringify(result);
        },
      },
      {
        name: "get_task",
        description:
          "Get a task by ID with its notes. Use this before proposing a breakdown or adding clarification notes to an existing task.",
        inputSchema: {
          type: "object" as const,
          properties: {
            taskId: { type: "string", description: "Task ID" },
          },
          required: ["taskId"],
        },
        execute: async (input) => {
          const task = await services.get(GetTask).executeWithNotes(input.taskId);
          return JSON.stringify(task || { error: "Task not found" });
        },
      },
      {
        name: "update_task",
        description:
          "Update a task's title, description, priority, date, or domain. Use description to store clarified outcome or execution context when the user provides it.",
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
          const updated = await services.get(UpdateTask).execute(taskId, data);
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
          const deleted = await services.get(DeleteTask).execute(input.taskId);
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
          const completed = await services.get(CompleteTask).execute(input.taskId);
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
          const carried = await services.get(CarryOverTask).execute(input.taskId, input.toDate);
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
          const discarded = await services.get(DiscardTask).execute(input.taskId);
          return JSON.stringify(discarded || { error: "Task not found" });
        },
      },

      // ─── Notes ─────────────────────────────────────────────
      {
        name: "add_task_note",
        description:
          "Add a note to a task. Use this to save breakdown steps, blockers, or clarified next actions. " +
          "For breakdowns, prefer one note per concrete step and phrase it as an executable action.",
        inputSchema: {
          type: "object" as const,
          properties: {
            taskId: { type: "string", description: "Task ID" },
            content: { type: "string", description: "Note content" },
            type: {
              type: "string",
              enum: ["note", "breakdown_step", "blocker"],
              description: "Note type. Use breakdown_step for executable steps, blocker for explicit obstacles.",
            },
          },
          required: ["taskId", "content"],
        },
        execute: async (input) => {
          const note = await services.get(AddTaskNote).execute(input.taskId, input.content, input.type);
          return JSON.stringify(note);
        },
      },

      // ─── Daily Review & Stats ──────────────────────────────
      {
        name: "get_end_of_day_review",
        description:
            "Get end-of-day review: completed, pending, completion rate. Shows pending tasks for carry-over/discard. " +
            "Use this when the user asks to close, review, or clean up the day.",
        inputSchema: {
          type: "object" as const,
          properties: {
            date: { type: "string", description: "Date (YYYY-MM-DD). Default: today." },
          },
          required: [],
        },
        execute: async (input) => {
          const result = await services.get(GetEndOfDayReview).execute(input.date);
          return JSON.stringify(result);
        },
      },
      {
        name: "carry_over_all_pending",
        description:
            "Carry over ALL pending tasks from a date to tomorrow (or another date). Use this only when the user explicitly wants to move everything.",
        inputSchema: {
          type: "object" as const,
          properties: {
            fromDate: { type: "string", description: "Source date (YYYY-MM-DD)" },
            toDate: { type: "string", description: "Target date (YYYY-MM-DD). Default: tomorrow." },
          },
          required: ["fromDate"],
        },
        execute: async (input) => {
          const results = await services.get(CarryOverAllPending).execute(input.fromDate, input.toDate);
          return JSON.stringify({ carriedOver: results.length, tasks: results });
        },
      },
      {
        name: "get_today_stats",
        description:
          "Get today's task stats: completed, pending, completion rate. Useful when helping the user plan the day or assess load.",
        inputSchema: {
          type: "object" as const,
          properties: {},
          required: [],
        },
        execute: async () => {
          const result = await services.get(GetDayStats).executeToday();
          return JSON.stringify(result);
        },
      },
      {
        name: "get_completion_trend",
        description:
          "Get daily completion rates for the last N days (default 7). Use this when planning or reviewing to detect overload or carry-over patterns.",
        inputSchema: {
          type: "object" as const,
          properties: {
            days: { type: "number", description: "Number of days (default 7, max 90)" },
          },
          required: [],
        },
        execute: async (input) => {
          const result = await services.get(GetDayStats).executeTrend(input.days || 7);
          return JSON.stringify(result);
        },
      },

      // ─── Insights & Streaks ──────────────────────────────
      ...(insightsStore ? [
        {
          name: "get_insights",
          description:
            "Get unread insights: achievements (streaks, perfect days), warnings (overload), " +
            "and suggestions (stuck tasks). ALWAYS call this at the start of a conversation " +
            "to surface relevant proactive information to the user.",
          inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
          },
          execute: async () => {
            const snapshot = insightsStore.getSnapshot();
            return JSON.stringify(snapshot);
          },
        },
        {
          name: "mark_insights_read",
          description: "Mark all insights as read after surfacing them to the user.",
          inputSchema: {
            type: "object" as const,
            properties: {},
            required: [],
          },
          execute: async () => {
            insightsStore.markAllRead();
            return JSON.stringify({ message: "All insights marked as read" });
          },
        },
      ] as AgentTool[] : []),
    ];
  }
}
