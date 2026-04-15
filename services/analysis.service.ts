// lib/services/analysis.service.ts
import { AnalysisListQuery } from "@/lib/validations/analysis";

// Helper to build query string with defaults
function buildAnalysisQuery(params?: Partial<AnalysisListQuery>) {
  const defaultParams: AnalysisListQuery = {
    page: 1,
    limit: 20,
    ...(params || {}),
  };
  const searchParams = new URLSearchParams();
  searchParams.append("page", String(defaultParams.page));
  searchParams.append("limit", String(defaultParams.limit));
  if (defaultParams.minMatchScore !== undefined)
    searchParams.append("minMatchScore", String(defaultParams.minMatchScore));
  if (defaultParams.verdict)
    searchParams.append("verdict", defaultParams.verdict);
  return searchParams.toString();
}

export const AnalysisService = {
  get: async (analysisId: string) => {
    const response = await fetch(`/api/analysis/${analysisId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Analysis not found");
    return result;
  },

  delete: async (analysisId: string) => {
    const response = await fetch(`/api/analysis/${analysisId}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Deletion failed");
    return result;
  },

  getByCV: async (cvId: string, params?: Partial<AnalysisListQuery>) => {
    const queryString = buildAnalysisQuery(params);
    const response = await fetch(`/api/cv/${cvId}/jobs?${queryString}`);
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch analyses");
    return result;
  },

  getByJob: async (jobId: string, params?: Partial<AnalysisListQuery>) => {
    const queryString = buildAnalysisQuery(params);
    const response = await fetch(`/api/jobs/${jobId}/cvs?${queryString}`);
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch analyses");
    return result;
  },
};
