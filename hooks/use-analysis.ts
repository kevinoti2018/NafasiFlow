// hooks/use-analysis.ts
import { useQuery } from "@tanstack/react-query";
import { AnalysisService } from "@/services/analysis.service";

export function useAnalysesByJob(
  jobId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["analyses", "job", jobId, params],
    queryFn: () => AnalysisService.getByJob(jobId, params),
    enabled: !!jobId,
  });
}
export function useAnalysis(analysisId: string) {
  return useQuery({
    queryKey: ["analyses", "detail", analysisId],
    queryFn: () => AnalysisService.get(analysisId),
    enabled: !!analysisId,
  });
}

export function useAnalysesByCV(
  cvId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["analyses", "cv", cvId, params],
    queryFn: () => AnalysisService.getByCV(cvId, params),
    enabled: !!cvId,
  });
}
