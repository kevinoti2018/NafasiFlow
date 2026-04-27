// hooks/use-user.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserService,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/services/user.service";
import { toast } from "sonner";

export const userKeys = {
  profile: ["user", "profile"] as const,
};

export function useUserProfile() {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: () => UserService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => UserService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
      toast.success("Profile updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordInput) => UserService.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => UserService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear(); // clear all cached queries after account deletion
      toast.success("Account deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}
