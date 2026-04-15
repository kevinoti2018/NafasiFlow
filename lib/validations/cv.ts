// lib/validations/cv.ts
import * as z from "zod";

export const cvUploadResponseSchema = z.object({
  cvVersion: z.any(),
  reused: z.boolean(),
});
export const analyzeJobCVBodySchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1),
  cvId: z.string().min(1),
});
export const cvListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  source: z.enum(["upload", "optimized", "generated"]).optional(),
  sortBy: z
    .enum(["createdAt", "atsFormatScore", "atsContentScore"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const analyzeCVSchema = z.object({
  jobIds: z.array(z.string().min(1)),
});

export type CVUploadResponse = z.infer<typeof cvUploadResponseSchema>;
export type AnalyzeCVInput = z.infer<typeof analyzeCVSchema>;

// Param schema for CV ID
export const cvIdParamSchema = z.object({
  cvId: z.string().min(1),
});

// Body schemas
export const analyzeCVBodySchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1, "At least one jobId is required"),
});

// Response types (not validated in API, but useful)
export type CVIdParam = z.infer<typeof cvIdParamSchema>;
export type CVListQuery = z.infer<typeof cvListQuerySchema>;
export type AnalyzeCVBody = z.infer<typeof analyzeCVBodySchema>;
