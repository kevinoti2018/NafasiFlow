import * as z from "zod";

export const jobIdParamSchema = z.object({
  jobId: z.string().min(1),
});

export const createJobBodySchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  rawContent: z.string().min(1, "Job description required"),
});

export const updateJobBodySchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  rawContent: z.string().min(1),
  jobStatus: z.enum(["open", "closed", "archived"]).optional(),
});

export const patchJobBodySchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  jobStatus: z.enum(["open", "closed", "archived"]).optional(),
});

export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  jobStatus: z.enum(["open", "closed", "archived"]).optional(),
});

export type JobIdParam = z.infer<typeof jobIdParamSchema>;
export type CreateJobBody = z.infer<typeof createJobBodySchema>;
export type UpdateJobBody = z.infer<typeof updateJobBodySchema>;
export type PatchJobBody = z.infer<typeof patchJobBodySchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
