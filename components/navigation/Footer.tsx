import Link from "next/link";
import { Flame } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-[#161b1d]/80 py-12 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25">
                <Flame className="text-white" size={18} />
              </div>
              <span className="uppercase tracking-widest text-sm font-bold">
                Nafasi Flow
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              A high-performance career system designed to optimize CVs, track
              applications, and master your professional narrative.
            </p>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              System
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  href="/my-account"
                  className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/my-account/cv"
                  className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  CV Optimizer
                </Link>
              </li>
              <li>
                <Link
                  href="/my-account/jobs"
                  className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  Job Tracker
                </Link>
              </li>
              <li>
                <Link
                  href="/my-account/applications"
                  className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  Applications
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-8 md:flex-row">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005f78]/40 opacity-75 dark:bg-[#005f78]/30" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#005f78] dark:bg-[#4db8d4]" />
            </div>
            Career Engine Operational • 2026
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Built for execution. No dark patterns.
          </p>
        </div>
      </div>
    </footer>
  );
}
