export type UserProfile = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  image?: string | null;
  isPasswordSet: boolean;
};

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export const UserService = {
  getProfile: async (): Promise<{ user: UserProfile }> => {
    const response = await fetch("/api/user/profile");
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch profile");
    return result;
  },

  updateProfile: async (
    data: UpdateProfileInput,
  ): Promise<{ user: UserProfile }> => {
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to update profile");
    return result;
  },

  changePassword: async (
    data: ChangePasswordInput,
  ): Promise<{ success: boolean }> => {
    const response = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to change password");
    return result;
  },

  deleteAccount: async (): Promise<{ success: boolean }> => {
    const response = await fetch("/api/user/account", { method: "DELETE" });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to delete account");
    return result;
  },
};
