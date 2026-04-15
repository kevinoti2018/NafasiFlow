// lib/validations/application.ts
import * as z from "zod";

export const appIdParamSchema = z.object({
  appId: z.string().min(1),
});

export const createApplicationBodySchema = z.object({
  jobId: z.string().min(1),
  cvVersionId: z.string().min(1),
  templateId: z.string().optional(),
});

export const updateApplicationBodySchema = z.object({
  status: z
    .enum(["saved", "applied", "interviewing", "rejected", "offered"])
    .optional(),
  templateId: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
});

export const applicationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(["saved", "applied", "interviewing", "rejected", "offered"])
    .optional(),
  jobId: z.string().optional(),
  cvVersionId: z.string().optional(),
});

export type AppIdParam = z.infer<typeof appIdParamSchema>;
export type CreateApplicationBody = z.infer<typeof createApplicationBodySchema>;
export type UpdateApplicationBody = z.infer<typeof updateApplicationBodySchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
