import Link from "next/link";
import { Flame, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4 dark:bg-slate-950">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 animate-pulse rounded-full bg-sky-500/5 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-sky-500/10 blur-3xl delay-1000 dark:bg-sky-500/5" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-slate-900 dark:shadow-slate-950/50 lg:grid-cols-2">
        {/* Left: Branding Panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-50 p-12 dark:bg-slate-950 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.1)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15)_0%,transparent_50%)]" />

          <div className="relative space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/20">
                <Flame className="text-white" size={18} />
              </div>
              <span className="text-lg font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Consistency
              </span>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
                <Sparkles size={12} />
                Now in Beta
              </div>
              <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-slate-100">
                Initialize Your <br />
                <span className="text-sky-500 dark:text-sky-400">
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
                { text: "Unlimited Application Tracking" },
                { text: "AI-Powered JD Analysis" },
                { text: "Professional PDF Templates" },
              ].map(({ text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 dark:bg-sky-500/20">
                    <CheckCircle2
                      className="text-sky-500 dark:text-sky-400"
                      size={14}
                    />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-2xl border border-sky-500/20 bg-white/60 p-5 backdrop-blur-sm dark:border-sky-500/10 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/40 opacity-75 dark:bg-sky-400/30" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500 dark:bg-sky-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
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

          <RegisterForm />

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="group inline-flex items-center gap-1 font-semibold text-sky-500 transition-colors hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300"
            >
              Sign in
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
