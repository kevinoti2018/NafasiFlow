import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinkedInService } from "@/services/linkedin.service";
import { toast } from "sonner";

export const linkedinKeys = {
  all: ["linkedin"] as const,
  lists: () => [...linkedinKeys.all, "list"] as const,
  list: () => [...linkedinKeys.lists()] as const,
  details: () => [...linkedinKeys.all, "detail"] as const,
  detail: (id: string) => [...linkedinKeys.details(), id] as const,
  versions: (id: string) => [...linkedinKeys.detail(id), "versions"] as const,
};

export function useLinkedInProfiles() {
  return useQuery({
    queryKey: linkedinKeys.list(),
    queryFn: () => LinkedInService.list(),
  });
}

export function useLinkedInProfile(id: string) {
  return useQuery({
    queryKey: linkedinKeys.detail(id),
    queryFn: () => LinkedInService.get(id),
    enabled: !!id,
  });
}

export function useLinkedInVersions(id: string) {
  return useQuery({
    queryKey: linkedinKeys.versions(id),
    queryFn: () => LinkedInService.getVersions(id),
    enabled: !!id,
  });
}

export function useSaveLinkedInProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => LinkedInService.save(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkedinKeys.lists() });
      toast.success("Profile saved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save");
    },
  });
}

// ✅ New: update a profile
export function useUpdateLinkedInProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      LinkedInService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: linkedinKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: linkedinKeys.lists() });
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update");
    },
  });
}

export function useOptimizeLinkedIn() {
  return useMutation({
    mutationFn: (data: any) => LinkedInService.optimize(data),
    onError: (error: Error) => {
      toast.error(error.message || "Optimization failed");
    },
  });
}

export function useDeleteLinkedInProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LinkedInService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkedinKeys.lists() });
      toast.success("Profile deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Deletion failed");
    },
  });
}
