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
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });

  // Handle OAuth and System Errors from URL
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
    <div className="w-full space-y-8">
      {/* Primary OAuth Method */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => signIn("google", { callbackUrl })}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-base font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
      >
        <FcGoogle className="text-2xl" />
        Access with Google
      </button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-100 dark:border-slate-800" />
        <span className="absolute bg-white dark:bg-slate-950 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
          Credential Access
        </span>
      </div>

      {/* Manual Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="ml-1 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            Email Address
          </label>
          <input
            type="email"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl border-0 bg-slate-100/50 dark:bg-slate-900 px-5 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="you@engine.com"
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[10px] font-bold text-emerald-600 uppercase hover:text-emerald-500 transition-colors"
            >
              Recovery
            </Link>
          </div>
          <input
            type="password"
            disabled={isLoading}
            className="h-14 w-full rounded-2xl border-0 bg-slate-100/50 dark:bg-slate-900 px-5 text-sm ring-1 ring-slate-200 dark:ring-slate-800 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••"
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? (
            <ImSpinner2 className="animate-spin text-xl" />
          ) : (
            "Resume Evolution"
          )}
        </button>
      </form>

      {/* Redirect Link */}
      <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
        <p className="text-xs font-bold tracking-tight text-slate-400 uppercase">
          New to the system?{" "}
          <Link
            href="/register"
            className="text-emerald-600 hover:text-emerald-500 transition-all underline underline-offset-4 decoration-emerald-500/20"
          >
            Initialize Account
          </Link>
        </p>
      </div>
    </div>
  );
};
