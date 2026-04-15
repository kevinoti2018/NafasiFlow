// lib/validations/analysis.ts
import * as z from "zod";

export const analysisIdParamSchema = z.object({
  analysisId: z.string().min(1),
});

export const analysisListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  minMatchScore: z.coerce.number().int().min(0).max(100).optional(),
  verdict: z.enum(["proceed", "consider", "high_risk"]).optional(),
});

export type AnalysisIdParam = z.infer<typeof analysisIdParamSchema>;
export type AnalysisListQuery = z.infer<typeof analysisListQuerySchema>;
