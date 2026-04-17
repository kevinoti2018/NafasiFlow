import Link from "next/link";
import { Flame, ShieldCheck, ArrowRight } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";
export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4 dark:bg-slate-950">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-slate-900 dark:shadow-slate-950/50 lg:grid-cols-2">
        {/* Left: Form Section */}
        <div className="flex flex-col justify-center p-10 md:p-16">
          <div className="mb-12">
            <div className="mb-8 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 dark:bg-sky-600">
                <Flame className="text-white" size={18} />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
                Consistency
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
          <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
            New to the platform?{" "}
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-semibold text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Create account
              <ArrowRight size={14} />
            </Link>
          </p>
        </div>

        {/* Right: Brand Panel */}
        <div className="relative hidden flex-col justify-between bg-slate-50 p-16 dark:bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.08)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.15)_0%,transparent_50%)]" />

          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
              <ShieldCheck size={14} />
              Secure & Encrypted
            </div>

            <blockquote>
              <p className="text-3xl font-bold leading-snug text-slate-900 dark:text-slate-100">
                `&quot;`Data-driven career growth starts with a single tracked
                application. `&quot;`
              </p>
              <footer className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                — The Consistency Engine
              </footer>
            </blockquote>
          </div>

          <div className="relative grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Status
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Encrypted Session
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
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
