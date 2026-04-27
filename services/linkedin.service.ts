export type LinkedInProfileInput = {
  name?: string;
  headline?: string;
  about?: string;
  experience?: string;
  skills?: string;
  certifications?: string;
  education?: string;
  volunteering?: string;
  parentId?: string;
};

export const LinkedInService = {
  save: async (data: LinkedInProfileInput) => {
    const response = await fetch("/api/linkedin/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Failed to save profile");
    return result;
  },

  list: async () => {
    const response = await fetch("/api/linkedin/profile");
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch profiles");
    return result;
  },

  get: async (id: string) => {
    const response = await fetch(`/api/linkedin/profile/${id}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Profile not found");
    return result;
  },

  getVersions: async (id: string) => {
    const response = await fetch(`/api/linkedin/profile/${id}/versions`);
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch versions");
    return result;
  },

  // ✅ New: update an existing profile
  update: async (id: string, data: LinkedInProfileInput) => {
    const response = await fetch(`/api/linkedin/profile/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to update profile");
    return result;
  },

  optimize: async (data: LinkedInProfileInput) => {
    const response = await fetch("/api/linkedin/optimize-structured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Optimization failed");
    return result;
  },

  delete: async (id: string) => {
    const response = await fetch(`/api/linkedin/profile/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Deletion failed");
    return result;
  },
};
