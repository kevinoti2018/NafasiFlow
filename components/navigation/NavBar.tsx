// Navbar.tsx (Landing page nav)
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Flame, LayoutDashboard, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-[#161b1d]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25 transition-transform group-hover:rotate-12">
            <Flame className="text-white" size={18} />
          </div>
          <span className="hidden text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-slate-100 sm:block">
            Nafasi Flow
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden items-center gap-8 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase md:flex">
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
          >
            AI Optimization
          </Link>
          <Link
            href="#templates"
            className="transition-colors hover:text-[#005f78] dark:hover:text-[#4db8d4]"
          >
            Templates
          </Link>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : isAuthenticated ? (
            <Link href="/my-account">
              <Button className="h-9 gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white shadow-lg shadow-[#005f78]/20 active:scale-95">
                <LayoutDashboard size={14} />
                <span className="text-xs font-semibold">My Tracker</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-[#005f78] dark:text-slate-400 dark:hover:text-[#4db8d4]"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 bg-[#005f78] hover:bg-[#004a5e] text-white shadow-lg shadow-[#005f78]/20">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Get Started
                  </span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
