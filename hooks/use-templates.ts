// hooks/use-templates.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = "/api/templates";

export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (params?: any) => [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
};

export function useTemplates(params?: {
  page?: number;
  limit?: number;
  type?: string;
  isDefault?: boolean;
}) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) searchParams.append(key, String(value));
        });
      }
      const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch templates");
      return result;
    },
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Template not found");
      return result;
    },
    enabled: !!id,
  });
}

export function useUploadTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      name,
      isDefault,
    }: {
      file: File;
      name: string;
      isDefault?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      if (isDefault) formData.append("isDefault", "true");
      const response = await fetch(API_BASE, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success("Template uploaded");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed");
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; isDefault?: boolean; metadata?: any };
    }) => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed");
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success("Template updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Update failed");
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Deletion failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success("Template deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Deletion failed");
    },
  });
}
