import * as z from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid work email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#?!@$%^&*-]).{8,}$/;
export const changePasswordSchema = z
  .object({
    oldPassword: z.string().regex(passwordRegex, {
      message:
        "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and a special character.",
    }),
    newPassword: z.string().regex(passwordRegex, {
      message:
        "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and a special character.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type changePasswordType = z.infer<typeof changePasswordSchema>;

export const setPasswordSchema = z
  .object({
    newPassword: z.string().regex(passwordRegex, {
      message:
        "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and a special character.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.confirmPassword === data.newPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type setPasswordType = z.infer<typeof setPasswordSchema>;
export const setPasswordAPISchema = z.object({
  newPassword: z.string().regex(passwordRegex, {
    message:
      "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and a special character.",
  }),
});
export type setPasswordAPIType = z.infer<typeof setPasswordAPISchema>;
export const changePasswordAPISchema = z.object({
  oldPassword: z.string().regex(passwordRegex, {
    message:
      "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and a special character.",
  }),
  newPassword: z.string().regex(passwordRegex, {
    message:
      "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number and a special character.",
  }),
});

export type changePasswordAPIType = z.infer<typeof changePasswordAPISchema>;
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide valid email"),
});
export type ForgotPasswordType = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .regex(new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$"), {
      message:
        "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, and number",
    }),
  token: z.string().min(1, "Token is required"),
});
export const resetPasswordUISchema = z.object({
  password: z.string().min(6, "Password should be atleast 6 characters"),
});

export const ActivateAccountSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
export type ActivateAccountType = z.infer<typeof ActivateAccountSchema>;

export type ResetPasswordtype = z.infer<typeof resetPasswordSchema>;

export type ResetPasswordUItype = z.infer<typeof resetPasswordUISchema>;
