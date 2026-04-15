"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { ImSpinner2 } from "react-icons/im";
import { signIn } from "next-auth/react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { AuthService } from "@/services/AuthService";

export const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [formData, setFormData] = useState<RegisterInput>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Handle OAuth Errors from URL (e.g., Google login fails)
  useEffect(() => {
    if (urlError) {
      let message = "An error occurred during registration.";
      if (urlError === "OAuthCallback")
        message = "Problem linking your social account.";
      if (urlError === "OAuthAccountNotLinked")
        message = "This email is already registered via password login.";

      toast.error("Auth Error", { description: message });
      router.replace("/register");
    }
  }, [urlError, router]);

  const { mutate: registerUser, isPending } = useMutation({
    mutationKey: ["register"],
    mutationFn: (data: RegisterInput) => AuthService.register(data),
    onSuccess: (data, variables) => {
      toast.success("Evolution Initialized", {
        description:
          data?.message || "Check your inbox for the activation link.",
      });
      // Redirecting to the verify-request page we just built
      router.push(
        `/auth/verify-request?email=${encodeURIComponent(variables.email)}`,
      );
    },
    onError: (error: Error) => {
      toast.error("Registration Failed", {
        description:
          error.message || "Please check your details and try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      return toast.error("Validation Error", {
        description: result.error.issues[0].message,
      });
    }

    registerUser(result.data);
  };

  return (
    <div className="w-full space-y-8">
      {/* Social Provider */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => signIn("google")}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-base font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
      >
        <FcGoogle className="text-2xl" />
        Enroll with Google
      </button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-100 dark:border-slate-800" />
        <span className="absolute bg-white dark:bg-slate-950 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
          Direct Enrollment
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              First Name
            </label>
            <input
              className="h-14 w-full rounded-2xl border-0 bg-slate-100/50 dark:bg-slate-900 px-5 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Kevin"
              disabled={isPending}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="ml-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Last Name
            </label>
            <input
              className="h-14 w-full rounded-2xl border-0 bg-slate-100/50 dark:bg-slate-900 px-5 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Otieno"
              disabled={isPending}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Email Address
          </label>
          <input
            type="email"
            className="h-14 w-full rounded-2xl border-0 bg-slate-100/50 dark:bg-slate-900 px-5 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="you@engine.com"
            disabled={isPending}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Create Password
          </label>
          <input
            type="password"
            className="h-14 w-full rounded-2xl border-0 bg-slate-100/50 dark:bg-slate-900 px-5 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••"
            disabled={isPending}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
        >
          {isPending ? (
            <ImSpinner2 className="animate-spin text-xl" />
          ) : (
            "Initialize Evolution"
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
        <p className="text-xs font-bold tracking-tight text-slate-400 uppercase">
          Already a member?{" "}
          <Link
            href="/login"
            className="text-emerald-600 hover:text-emerald-500 transition-all underline underline-offset-4 decoration-emerald-500/20"
          >
            Access Session
          </Link>
        </p>
      </div>
    </div>
  );
};
