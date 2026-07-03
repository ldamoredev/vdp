import { z } from "zod";

export const updateAppSettingsSchema = z
  .object({
    registrationEnabled: z.boolean().optional(),
    chatEnabledForUsers: z.boolean().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "At least one setting must be provided",
  });

export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
