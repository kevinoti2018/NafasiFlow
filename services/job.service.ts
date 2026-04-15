// lib/services/job.service.ts
import {
  CreateJobBody,
  UpdateJobBody,
  PatchJobBody,
  JobListQuery,
} from "@/lib/validations/job";

// Helper to build query string with defaults
function buildJobListQuery(params?: Partial<JobListQuery>) {
  const defaultParams: JobListQuery = {
    page: 1,
    limit: 20,
    ...(params || {}),
  };
  const searchParams = new URLSearchParams();
  searchParams.append("page", String(defaultParams.page));
  searchParams.append("limit", String(defaultParams.limit));
  if (defaultParams.status) searchParams.append("status", defaultParams.status);
  return searchParams.toString();
}

export const JobService = {
  create: async (data: CreateJobBody) => {
    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Job creation failed");
    return result;
  },

  list: async (params?: Partial<JobListQuery>) => {
    const queryString = buildJobListQuery(params);
    const response = await fetch(`/api/jobs?${queryString}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch jobs");
    return result;
  },

  get: async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Job not found");
    return result;
  },

  update: async (jobId: string, data: UpdateJobBody) => {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Update failed");
    return result;
  },

  patch: async (jobId: string, data: PatchJobBody) => {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Patch failed");
    return result;
  },

  delete: async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Deletion failed");
    return result;
  },
};
