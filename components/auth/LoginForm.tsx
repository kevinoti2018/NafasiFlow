"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { ImSpinner2 } from "react-icons/im";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/my-account";

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (urlError) {
      let message = "An error occurred during authentication.";
      if (urlError === "CredentialsSignin")
        message = "Invalid email or password.";
      if (urlError === "SessionRequired")
        message = "Please sign in to access that page.";

      toast.error("Access Denied", { description: message });
      router.replace("/login");
    }
  }, [urlError, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setIsLoading(false);
      return toast.error("Validation Error", {
        description: result.error.issues[0].message,
      });
    }

    const signInResult = await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.error("Authentication Failed", {
        description: "Invalid credentials. Please verify your details.",
      });
      setIsLoading(false);
    } else {
      toast.success("Identity Verified", {
        description: "System access granted. Initializing dashboard...",
      });
      router.push(callbackUrl);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Primary OAuth Method */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => signIn("google", { callbackUrl })}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b1d] text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
      >
        <FcGoogle className="text-xl" />
        Access with Google
      </button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-100 dark:border-slate-800" />
        <span className="absolute bg-white dark:bg-[#1c2225] px-4 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
          Credential Access
        </span>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            disabled={isLoading}
            className="h-12 w-full rounded-xl border-0 bg-slate-100 dark:bg-[#161b1d] px-4 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-[#005f78]"
            placeholder="you@engine.com"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-[#005f78] hover:text-[#004a5e] dark:text-[#4db8d4] transition-colors"
            >
              Recovery
            </Link>
          </div>
          <input
            type="password"
            disabled={isLoading}
            className="h-12 w-full rounded-xl border-0 bg-slate-100 dark:bg-[#161b1d] px-4 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-[#005f78]"
            placeholder="••••••••"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#005f78] text-sm font-semibold text-white shadow-lg shadow-[#005f78]/20 transition-all hover:bg-[#004a5e] active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <ImSpinner2 className="animate-spin text-lg" />
          ) : (
            "Resume Evolution"
          )}
        </button>
      </form>

      {/* Redirect Link */}
      <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          New to the system?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#005f78] hover:text-[#004a5e] dark:text-[#4db8d4] transition-colors"
          >
            Initialize Account
          </Link>
        </p>
      </div>
    </div>
  );
};
