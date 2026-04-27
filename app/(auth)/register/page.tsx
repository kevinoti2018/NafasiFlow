import { Flame, CheckCircle2, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#161b1d] p-4 my-2">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-[#1c2225] lg:grid-cols-2 border border-slate-200 dark:border-slate-800">
        {/* Left: Branding Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-50 p-12 dark:bg-[#161b1d] lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,95,120,0.1)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(0,95,120,0.15)_0%,transparent_50%)]" />

          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25">
                <Flame className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Nafasi Flow
              </span>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#005f78]/20 bg-[#005f78]/10 px-3 py-1 text-xs font-semibold text-[#005f78] dark:text-[#4db8d4]">
                <Sparkles size={12} />
                Now in Beta
              </div>
              <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-slate-100">
                Initialize Your <br />
                <span className="text-[#005f78] dark:text-[#4db8d4]">
                  Career Engine
                </span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Join thousands of developers tracking their journey to 10x
                growth.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "Unlimited Application Tracking",
                "AI-Powered JD Analysis",
                "Professional PDF Templates",
              ].map((text) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#005f78]/10 dark:bg-[#005f78]/20">
                    <CheckCircle2
                      className="text-[#005f78] dark:text-[#4db8d4]"
                      size={14}
                    />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border border-[#005f78]/20 bg-white/60 p-5 backdrop-blur-sm dark:border-[#005f78]/10 dark:bg-[#1c2225]/60">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005f78]/40 opacity-75 dark:bg-[#005f78]/30" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#005f78] dark:bg-[#4db8d4]" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#005f78] dark:text-[#4db8d4]">
                  System Status
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Phase 1 Operational
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form Section */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <div className="mb-8 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Start tracking your career growth today
            </p>
          </div>

          <Suspense
            fallback={<div className="p-4 text-center">Loading...</div>}
          >
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
