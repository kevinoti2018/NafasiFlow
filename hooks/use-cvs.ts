// hooks/use-cvs.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CVService } from "@/services/cv.service";
import { toast } from "sonner";
import type { CVListQuery } from "@/lib/validations/cv";

export const cvKeys = {
  all: ["cvs"] as const,
  lists: () => [...cvKeys.all, "list"] as const,
  list: (params?: Partial<CVListQuery>) => [...cvKeys.lists(), params] as const,
  details: () => [...cvKeys.all, "detail"] as const,
  detail: (id: string) => [...cvKeys.details(), id] as const,
};

// ✅ Use Partial<CVListQuery> for full type safety
export function useCVs(params?: Partial<CVListQuery>) {
  return useQuery({
    queryKey: cvKeys.list(params),
    queryFn: () => CVService.list(params),
  });
}

// Rest remains unchanged...
export function useCV(id: string) {
  return useQuery({
    queryKey: cvKeys.detail(id),
    queryFn: () => CVService.get(id),
    enabled: !!id,
  });
}

export function useUploadCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => CVService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cvKeys.lists() });
      toast.success("CV uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed");
    },
  });
}

export function useOptimizeCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cvId,
      jobId,
      type,
    }: {
      cvId: string;
      jobId?: string;
      type: "general" | "job";
    }) => {
      const response = await fetch(`/api/cv/${cvId}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, type }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Optimization failed");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cvKeys.lists() });
      toast.success("Optimized CV created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Optimization failed");
    },
  });
}

export function useDeleteCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CVService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cvKeys.lists() });
      toast.success("CV deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Deletion failed");
    },
  });
}

export function useReanalyzeCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cvId: string) => {
      const response = await fetch(`/api/cv/${cvId}/reanalyze`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Re-analysis failed");
      return result;
    },
    onSuccess: (_, cvId) => {
      queryClient.invalidateQueries({ queryKey: cvKeys.detail(cvId) });
      toast.success("CV re-analyzed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Re-analysis failed");
    },
  });
}

export function useUpdateCV() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cvId,
      data,
    }: {
      cvId: string;
      data: { name?: string; profile?: any };
    }) => {
      const response = await fetch(`/api/cv/${cvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed");
      return result;
    },
    onSuccess: (_, { cvId }) => {
      queryClient.invalidateQueries({ queryKey: cvKeys.detail(cvId) });
      queryClient.invalidateQueries({ queryKey: cvKeys.lists() });
      toast.success("CV updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Update failed");
    },
  });
}
