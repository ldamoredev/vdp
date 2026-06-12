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

// ─── Counters ("days since") ─────────────────────────────
export const createCounterSchema = z.object({
  name: z.string().trim().min(1).max(100),
  emoji: z.string().trim().max(8).nullable().optional(),
  dailyCost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Expected a decimal amount")
    .nullable()
    .optional(),
  startedAt: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
});

export const counterRelapseSchema = z.object({
  date: optionalLocalDateStringSchema, // YYYY-MM-DD, defaults to today
});
