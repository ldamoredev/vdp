import { z } from "zod";

// ─── Enums ───────────────────────────────────────────────
export const taskStatusEnum = z.enum(["pending", "done", "carried_over", "discarded"]);
export const taskPriorityEnum = z.coerce.number().int().min(1).max(3);
export const taskDomainEnum = z.enum(["wallet", "health", "work", "people", "study"]);

// ─── Tasks ──────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  priority: taskPriorityEnum.default(2),
  scheduledDate: z.string().optional(), // YYYY-MM-DD, defaults to today
  domain: taskDomainEnum.nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  priority: taskPriorityEnum.optional(),
  scheduledDate: z.string().optional(),
  domain: taskDomainEnum.nullable().optional(),
  status: taskStatusEnum.optional(),
});

export const taskFiltersSchema = z.object({
  scheduledDate: z.string().optional(),
  status: taskStatusEnum.optional(),
  domain: taskDomainEnum.optional(),
  priority: taskPriorityEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Task Notes ─────────────────────────────────────────
export const createTaskNoteSchema = z.object({
  content: z.string().min(1),
});

// ─── Carry Over ─────────────────────────────────────────
export const carryOverSchema = z.object({
  toDate: z.string().optional(), // YYYY-MM-DD, defaults to tomorrow
});

export const carryOverAllSchema = z.object({
  fromDate: z.string(), // YYYY-MM-DD
  toDate: z.string().optional(),
});

// ─── Stats ──────────────────────────────────────────────
export const trendFiltersSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const domainStatsFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
