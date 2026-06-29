import { z } from "zod";
import { idParamsSchema } from "./common";

export const inboxItemStatusEnum = z.enum(["pending", "triaged", "discarded"]);
export const inboxItemIdParamsSchema = idParamsSchema;

export const captureInboxItemSchema = z.object({
  text: z.string().min(1).max(2000),
  note: z.string().max(2000).nullable().optional(),
});

export const triageInboxItemSchema = z.object({
  routedTo: z.string().min(1).max(40),
});
