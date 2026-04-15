// hooks/use-analysis.ts
import { useQuery } from "@tanstack/react-query";
import { AnalysisService } from "@/services/analysis.service";

// Query keys for cache management
export const analysisKeys = {
  all: ["analyses"] as const,
  detail: (id: string) => [...analysisKeys.all, "detail", id] as const,
  byJob: (jobId: string, params?: any) =>
    [...analysisKeys.all, "job", jobId, params] as const,
  byCV: (cvId: string, params?: any) =>
    [...analysisKeys.all, "cv", cvId, params] as const,
};

export function useAnalysesByJob(
  jobId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: analysisKeys.byJob(jobId, params),
    queryFn: () => AnalysisService.getByJob(jobId, params),
    enabled: !!jobId,
  });
}

export function useAnalysesByCV(
  cvId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: analysisKeys.byCV(cvId, params),
    queryFn: () => AnalysisService.getByCV(cvId, params),
    enabled: !!cvId,
  });
}

// ✅ Add this hook for fetching a single analysis
export function useAnalysis(analysisId: string) {
  return useQuery({
    queryKey: analysisKeys.detail(analysisId),
    queryFn: () => AnalysisService.get(analysisId),
    enabled: !!analysisId,
  });
}
