import { RegisterInput } from "@/lib/validations/auth";

export const AuthService = {
  register: async (data: RegisterInput) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Registration failed");
    return result;
  },

  verifyEmail: async (token: string) => {
    const response = await fetch(`/api/auth/verify?token=${token}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Verification failed");
    return result;
  },

  // Added this for your resend logic
  resendVerification: async (email: string) => {
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || "Failed to dispatch email");
    return result;
  },
};
