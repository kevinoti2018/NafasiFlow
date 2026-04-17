// lib/services/application.service.ts
import type {
  CreateApplicationBody,
  UpdateApplicationBody,
  ApplicationListQuery,
} from "@/lib/validations/application";

export const ApplicationService = {
  create: async (data: CreateApplicationBody) => {
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Application creation failed");
    return result;
  },

  list: async (params?: ApplicationListQuery) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(
      `/api/applications?${searchParams.toString()}`,
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch applications");
    return result;
  },

  get: async (appId: string) => {
    const response = await fetch(`/api/applications/${appId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Application not found");
    return result;
  },

  update: async (appId: string, data: UpdateApplicationBody) => {
    const response = await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Update failed");
    return result;
  },

  delete: async (appId: string) => {
    const response = await fetch(`/api/applications/${appId}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Deletion failed");
    return result;
  },

  getTimeline: async (appId: string) => {
    const response = await fetch(`/api/applications/${appId}/timeline`);
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch timeline");
    return result;
  },
};
