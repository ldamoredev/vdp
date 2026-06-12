import { z } from "zod";
import { idParamsSchema, optionalLocalDateStringSchema } from "./common";

// ─── Habits (the only live health surface) ───────────────
export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().trim().max(8).nullable().optional(),
});

export const habitIdParamsSchema = idParamsSchema;

export const habitLogSchema = z.object({
  date: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
});
