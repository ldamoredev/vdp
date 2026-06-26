import { z } from "zod";
import { idParamsSchema, localDateStringSchema } from "./common";

export const projectKindEnum = z.enum(["work", "personal"]);
export const projectStatusEnum = z.enum(["active", "archived"]);
export const clientStatusEnum = z.enum(["active", "archived"]);
export const taskBoardStatusEnum = z.enum(["backlog", "next", "doing", "done"]);

export const projectIdParamsSchema = idParamsSchema;

export const createProjectSchema = z.object({
  kind: projectKindEnum,
  outcome: z.string().min(1).max(240),
  nextAction: z.string().min(1).max(240),
  focus: z.string().min(1).max(160),
  clientId: z.string().uuid().nullable().optional(),
  client: z.string().min(1).max(160).nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().strict();

export const assignTaskToProjectSchema = z.object({
  taskId: z.string().uuid(),
  boardStatus: taskBoardStatusEnum.nullable().optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(160),
});

export const updateClientSchema = createClientSchema.partial().strict();

export const timeEntryIdParamsSchema = idParamsSchema;

export const logTimeEntrySchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().nullable().optional(),
  date: localDateStringSchema,
  minutes: z.number().int().min(1),
  note: z.string().max(2000).nullable().optional(),
});

export const updateTimeEntrySchema = logTimeEntrySchema.partial().strict();

export const timeEntryFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  fromDate: localDateStringSchema.optional(),
  toDate: localDateStringSchema.optional(),
});

export const projectHoursReportQuerySchema = z.object({
  fromDate: localDateStringSchema,
  toDate: localDateStringSchema,
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
});
