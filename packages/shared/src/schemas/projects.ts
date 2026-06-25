import { z } from "zod";
import { idParamsSchema } from "./common";

export const projectKindEnum = z.enum(["work", "personal"]);
export const projectStatusEnum = z.enum(["active", "archived"]);
export const taskBoardStatusEnum = z.enum(["backlog", "next", "doing", "done"]);

export const projectIdParamsSchema = idParamsSchema;

export const createProjectSchema = z.object({
  kind: projectKindEnum,
  outcome: z.string().min(1).max(240),
  nextAction: z.string().min(1).max(240),
  focus: z.string().min(1).max(160),
  client: z.string().min(1).max(160).nullable().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().strict();

export const assignTaskToProjectSchema = z.object({
  taskId: z.string().uuid(),
  boardStatus: taskBoardStatusEnum.nullable().optional(),
});
