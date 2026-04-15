// lib/services/cv.service.ts
import { CVListQuery, AnalyzeCVInput } from "@/lib/validations/cv";

export const CVService = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/cv/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Upload failed");
    return result;
  },

  list: async (params?: Partial<CVListQuery>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`/api/cv/list?${searchParams.toString()}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to fetch CVs");
    return result;
  },

  get: async (cvId: string) => {
    const response = await fetch(`/api/cv/${cvId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "CV not found");
    return result;
  },

  delete: async (cvId: string) => {
    const response = await fetch(`/api/cv/${cvId}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Deletion failed");
    return result;
  },

  analyze: async (cvId: string, data: AnalyzeCVInput) => {
    const response = await fetch(`/api/cv/${cvId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Analysis failed");
    return result;
  },
};
