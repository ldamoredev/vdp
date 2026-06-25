import { z } from "zod";
import {
  idParamsSchema,
  localDateStringSchema,
  localDateRangeSchema,
  optionalLocalDateStringSchema,
  daysWindowSchema,
} from "./common";

// ─── Enums ───────────────────────────────────────────────
export const taskStatusEnum = z.enum(["pending", "in_progress", "done", "discarded"]);
export const taskPriorityEnum = z.coerce.number().int().min(1).max(3);
export const taskDomainEnum = z.enum(["wallet", "health", "work", "people", "study"]);

// ─── Daily review state (R1/R2) ─────────────────────────
export const reviewStateQuerySchema = z.object({ date: localDateStringSchema });

export const saveDailyReviewStateSchema = z.object({
  date: localDateStringSchema,
  acknowledgedSignalIds: z.array(z.string()).default([]),
  watchedCategoryIds: z.array(z.string()).default([]),
  note: z.string().default(""),
  openedAt: z.string().datetime().nullable().default(null),
  completedAt: z.string().datetime().nullable().default(null),
  focusTaskId: z.string().uuid().nullable().default(null),
  plannedAt: z.string().datetime().nullable().default(null),
});

// ─── Tasks ──────────────────────────────────────────────
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  priority: taskPriorityEnum.default(2),
  scheduledDate: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
  domain: taskDomainEnum.nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  priority: taskPriorityEnum.optional(),
  scheduledDate: optionalLocalDateStringSchema,
  domain: taskDomainEnum.nullable().optional(),
}).strict();

export const taskFiltersSchema = z.object({
  scheduledDate: optionalLocalDateStringSchema,
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
  toDate: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to tomorrow
});

export const carryOverAllSchema = z.object({
  fromDate: localDateStringSchema, // YYYY-MM-DD
  toDate: optionalLocalDateStringSchema,
});

// ─── Stats ──────────────────────────────────────────────
export const trendFiltersSchema = daysWindowSchema;

export const reviewFiltersSchema = z.object({
  date: optionalLocalDateStringSchema,
});

export const domainStatsFiltersSchema = localDateRangeSchema;
