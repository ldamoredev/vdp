import { z } from "zod";
import { idParamsSchema, localDateStringSchema } from "./common";

export const medicalRecordTypeSchema = z.enum([
  "consulta",
  "estudio",
  "vacuna",
  "receta",
  "otro",
]);

export const createMedicalRecordSchema = z.object({
  type: medicalRecordTypeSchema,
  title: z.string().trim().min(1).max(160),
  recordDate: localDateStringSchema, // YYYY-MM-DD
  professional: z.string().trim().max(160).nullable().optional(),
  specialty: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial();

export const medicalRecordIdParamsSchema = idParamsSchema;

export const attachmentIdParamsSchema = z.object({
  id: z.string().uuid(),
  attachmentId: z.string().uuid(),
});
