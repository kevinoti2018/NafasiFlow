import { AnalysisListQuery } from "@/lib/validations/analysis";

type GetAllAnalysesParams = Partial<AnalysisListQuery> & {
  jobId?: string;
  cvId?: string;
};

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
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(
      `/api/cv/${cvId}/jobs?${searchParams.toString()}`,
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch analyses");
    return result;
  },

  getByJob: async (jobId: string, params?: Partial<AnalysisListQuery>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(
      `/api/jobs/${jobId}/cvs?${searchParams.toString()}`,
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch analyses");
    return result;
  },

  getAll: async (params?: GetAllAnalysesParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`/api/analysis?${searchParams.toString()}`);
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch analyses");
    return result;
  },
};
