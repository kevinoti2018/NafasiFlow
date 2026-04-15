// hooks/use-jobs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobService } from "@/services/job.service";
import { toast } from "sonner";
import type {
  CreateJobBody,
  UpdateJobBody,
  JobListQuery,
} from "@/lib/validations/job";

export const jobKeys = {
  all: ["jobs"] as const,
  lists: () => [...jobKeys.all, "list"] as const,
  list: (params?: Partial<JobListQuery>) =>
    [...jobKeys.lists(), params] as const,
  details: () => [...jobKeys.all, "detail"] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
};

export function useJobs(params?: Partial<JobListQuery>) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => JobService.list(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => JobService.get(id),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateJobBody) => JobService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      toast.success("Job created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create job");
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobBody }) =>
      JobService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
      toast.success("Job updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update job");
    },
  });
}
// inside use-jobs.ts
export function useRetryJobAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}/retry`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Retry failed");
      return result;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      toast.success("Analysis retriggered successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry analysis");
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => JobService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
      toast.success("Job deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete job");
    },
  });
}
