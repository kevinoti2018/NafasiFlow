/* eslint-disable @typescript-eslint/no-explicit-any */
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

export function useAnalysesByCV(
  cvId: string,
  params?: { page?: number; limit?: number },
) {
  return useQuery<{ analyses: AnalysisResult[]; pagination: any }>({
    queryKey: ["analyses", "cv", cvId, params],
    queryFn: () => AnalysisService.getByCV(cvId, params),
    enabled: !!cvId,
  });
}
