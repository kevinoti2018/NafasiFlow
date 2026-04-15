// hooks/use-job-analysis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useAnalyzeCVWithJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, cvId }: { jobId: string; cvId: string }) => {
      const response = await fetch(`/api/jobs/${jobId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, jobIds: [jobId] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Analysis failed");
      return result;
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["analyses", "job", jobId] });
      toast.success("CV analysis completed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to analyze CV");
    },
  });
}

export function useReanalyzeJobCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, cvId }: { jobId: string; cvId: string }) => {
      const response = await fetch(`/api/jobs/${jobId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, jobIds: [jobId] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Re-analysis failed");
      return result;
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["analyses", "job", jobId] });
      toast.success("CV re-analyzed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to re-analyze CV");
    },
  });
}

export function useDeleteJobAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await fetch(`/api/analysis/${analysisId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Deletion failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Analysis deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete analysis");
    },
  });
}
