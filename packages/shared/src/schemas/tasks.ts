import { z } from "zod";
import {
  dateRangeSchema,
  idParamsSchema,
  optionalDateStringSchema,
  daysWindowSchema,
} from "./common";

// ─── Enums ───────────────────────────────────────────────
export const taskStatusEnum = z.enum(["pending", "done", "discarded"]);
export const taskPriorityEnum = z.coerce.number().int().min(1).max(3);
export const taskDomainEnum = z.enum(["wallet", "health", "work", "people", "study"]);

// ─── Tasks ──────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  priority: taskPriorityEnum.default(2),
  scheduledDate: optionalDateStringSchema, // YYYY-MM-DD, defaults to today
  domain: taskDomainEnum.nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  priority: taskPriorityEnum.optional(),
  scheduledDate: optionalDateStringSchema,
  domain: taskDomainEnum.nullable().optional(),
}).strict();

export const taskFiltersSchema = z.object({
  scheduledDate: optionalDateStringSchema,
  status: taskStatusEnum.optional(),
  domain: taskDomainEnum.optional(),
  priority: taskPriorityEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const taskIdParamsSchema = idParamsSchema;

// ─── Task Notes ─────────────────────────────────────────
export const taskNoteTypeEnum = z.enum(["note", "breakdown_step", "blocker"]);

export const createTaskNoteSchema = z.object({
  content: z.string().min(1),
  type: taskNoteTypeEnum.default("note"),
});

// ─── Carry Over ─────────────────────────────────────────
export const carryOverSchema = z.object({
  toDate: optionalDateStringSchema, // YYYY-MM-DD, defaults to tomorrow
});

export const carryOverAllSchema = z.object({
  fromDate: z.string(), // YYYY-MM-DD
  toDate: optionalDateStringSchema,
});

// ─── Stats ──────────────────────────────────────────────
export const trendFiltersSchema = daysWindowSchema;

export const reviewFiltersSchema = z.object({
  date: optionalDateStringSchema,
});

export const domainStatsFiltersSchema = dateRangeSchema;
