import { useQuery } from "@tanstack/react-query";
import { AnalysisService } from "@/services/analysis.service";

export const analysisKeys = {
  all: ["analysis"] as const,
  lists: () => [...analysisKeys.all, "list"] as const,
  list: (params?: any) => [...analysisKeys.lists(), params] as const,
  details: () => [...analysisKeys.all, "detail"] as const,
  detail: (id: string) => [...analysisKeys.details(), id] as const,
  byJob: (jobId: string, params?: any) =>
    [...analysisKeys.all, "job", jobId, params] as const,
  byCV: (cvId: string, params?: any) =>
    [...analysisKeys.all, "cv", cvId, params] as const,
};

export function useAnalysesByJob(
  jobId: string,
  params?: {
    page?: number;
    limit?: number;
    minMatchScore?: number;
    verdict?: "proceed" | "consider" | "high_risk";
  },
) {
  return useQuery({
    queryKey: analysisKeys.byJob(jobId, params),
    queryFn: () => AnalysisService.getByJob(jobId, params),
    enabled: !!jobId,
  });
}

export function useAnalysesByCV(
  cvId: string,
  params?: {
    page?: number;
    limit?: number;
    minMatchScore?: number;
    verdict?: "proceed" | "consider" | "high_risk";
  },
) {
  return useQuery({
    queryKey: analysisKeys.byCV(cvId, params),
    queryFn: () => AnalysisService.getByCV(cvId, params),
    enabled: !!cvId,
  });
}

export function useAnalysis(analysisId: string) {
  return useQuery({
    queryKey: analysisKeys.detail(analysisId),
    queryFn: () => AnalysisService.get(analysisId),
    enabled: !!analysisId,
  });
}

export function useAllAnalyses(params?: {
  page?: number;
  limit?: number;
  minMatchScore?: number;
  verdict?: "proceed" | "consider" | "high_risk";
  jobId?: string;
  cvId?: string;
}) {
  return useQuery({
    queryKey: analysisKeys.list(params),
    queryFn: () => AnalysisService.getAll(params),
  });
}
