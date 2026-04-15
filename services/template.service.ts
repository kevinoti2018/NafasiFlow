// lib/services/template.service.ts
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateListQuery,
} from "@/lib/validations/template";

export const TemplateService = {
  create: async (data: CreateTemplateInput) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("name", data.name);
    if (data.isDefault) formData.append("isDefault", "true");
    const response = await fetch("/api/templates", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Template upload failed");
    return result;
  },

  list: async (params?: TemplateListQuery) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const response = await fetch(`/api/templates?${searchParams.toString()}`);
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch templates");
    return result;
  },

  get: async (templateId: string) => {
    const response = await fetch(`/api/templates/${templateId}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Template not found");
    return result;
  },

  update: async (templateId: string, data: UpdateTemplateInput) => {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Update failed");
    return result;
  },

  delete: async (templateId: string) => {
    const response = await fetch(`/api/templates/${templateId}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Deletion failed");
    return result;
  },
};
