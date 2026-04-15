"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Flame, LayoutDashboard, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Brand Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform group-hover:rotate-12">
            <Flame className="text-primary-foreground" size={18} />
          </div>
          <span className="hidden text-xl font-bold tracking-tighter text-foreground uppercase sm:block">
            Consistency
          </span>
        </Link>

        {/* Center Navigation - Relevant to Job Search Flow */}
        <div className="hidden items-center gap-8 text-[10px] font-black tracking-widest text-muted-foreground uppercase md:flex">
          <Link
            href="#how-it-works"
            className="transition-colors hover:text-primary"
          >
            AI Optimization
          </Link>
          <Link
            href="#templates"
            className="transition-colors hover:text-primary"
          >
            Templates
          </Link>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
          <ThemeToggle />

          <div className="hidden h-6 w-[1px] bg-border sm:block" />

          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
          ) : isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="h-9 gap-2 rounded-full px-5 text-[10px] font-black tracking-widest uppercase shadow-lg active:scale-95">
                <LayoutDashboard size={14} />
                <span>My Tracker</span>
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-[10px] font-black uppercase tracking-widest hover:text-primary"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 rounded-full bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
