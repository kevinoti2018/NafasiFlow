// lib/validations/template.ts
import * as z from "zod";

export const templateIdParamSchema = z.object({
  templateId: z.string().min(1),
});

export const createTemplateBodySchema = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().optional(),
});
// File is handled via FormData, not JSON

export const updateTemplateBodySchema = z.object({
  name: z.string().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  file: z.instanceof(File),
  isDefault: z.boolean().optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().optional(),
  isDefault: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const templateListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(["pdf", "docx"]).optional(),
  isDefault: z.boolean().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export type TemplateIdParam = z.infer<typeof templateIdParamSchema>;
export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;
