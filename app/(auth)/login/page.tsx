import { Flame, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#161b1d] p-4 my-2">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-[#1c2225] lg:grid-cols-2 border border-slate-200 dark:border-slate-800">
        {/* Left: Form Section */}
        <div className="flex flex-col justify-center p-10 md:p-16">
          <div className="mb-10">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25">
                <Flame className="text-white" size={18} />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
                Nafasi Flow
              </span>
            </div>

            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <Suspense
            fallback={<div className="p-4 text-center">Loading...</div>}
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Right: Brand Panel */}
        <div className="relative hidden flex-col justify-between bg-slate-50 p-16 dark:bg-[#161b1d] lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,95,120,0.08)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(0,95,120,0.15)_0%,transparent_50%)]" />

          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#005f78]/20 bg-[#005f78]/10 px-4 py-1.5 text-xs font-semibold text-[#005f78] dark:text-[#4db8d4]">
              <ShieldCheck size={14} />
              Secure & Encrypted
            </div>

            <blockquote>
              <p className="text-3xl font-bold leading-snug text-slate-900 dark:text-slate-100">
                &quot;Data-driven career growth starts with a single tracked
                application.&quot;
              </p>
              <footer className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                — The Consistency Engine
              </footer>
            </blockquote>
          </div>

          <div className="relative grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#1c2225]">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Status
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Encrypted Session
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#1c2225]">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Target
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                10x Dev Velocity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
