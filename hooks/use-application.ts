// hooks/use-applications.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = "/api/applications";

export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params?: any) => [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};

export function useApplications(params?: {
  page?: number;
  limit?: number;
  status?: string;
  jobId?: string;
  cvVersionId?: string;
}) {
  return useQuery({
    queryKey: applicationKeys.list(params),
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
        throw new Error(result.error || "Failed to fetch applications");
      return result;
    },
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}`);
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Application not found");
      return result;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      jobId: string;
      cvVersionId: string;
      templateId?: string;
    }) => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Creation failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      toast.success("Application created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create application");
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { status?: string; templateId?: string; appliedAt?: string };
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
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      toast.success("Application updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update application");
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Deletion failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.lists() });
      toast.success("Application deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete application");
    },
  });
}

export function useApplicationTimeline(id: string) {
  return useQuery({
    queryKey: [...applicationKeys.detail(id), "timeline"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/${id}/timeline`);
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Failed to fetch timeline");
      return result;
    },
    enabled: !!id,
  });
}
