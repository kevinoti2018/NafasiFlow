"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-16" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group relative flex h-9 w-16 cursor-pointer items-center rounded-full border p-1 transition-all duration-500 ease-in-out ${
        isDark
          ? "border-primary/20 bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
          : "border-primary/30 bg-gradient-to-br from-primary/80 to-primary shadow-[inset_0_2px_4px_rgba(var(--primary),0.2)]"
      }`}
      aria-label="Toggle theme"
    >
      {/* Internal Track Icons */}
      <div className="pointer-events-none flex w-full items-center justify-between px-1.5">
        <Sun
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isDark ? "text-primary/40 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <Moon
          className={`h-3.5 w-3.5 transition-all duration-300 ${
            isDark ? "scale-50 opacity-0" : "text-primary-foreground opacity-90"
          }`}
        />
      </div>

      {/* Sliding Knob */}
      <div
        className={`absolute flex h-7 w-7 items-center justify-center rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark
            ? "translate-x-7 rotate-[360deg] border border-primary/50 bg-background"
            : "translate-x-0 rotate-0 bg-background"
        }`}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-primary" fill="currentColor" />
        ) : (
          <Sun className="h-4 w-4 text-primary" fill="currentColor" />
        )}
      </div>

      {/* Status Particles */}
      {isDark && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-2 left-3 h-0.5 w-0.5 animate-pulse rounded-full bg-primary/40 opacity-50" />
          <div className="absolute bottom-3 left-5 h-0.5 w-0.5 animate-pulse rounded-full bg-muted-foreground/30 delay-300" />
          <Sparkles className="absolute bottom-1.5 left-2 h-2 w-2 animate-bounce text-primary/20" />
        </div>
      )}
    </button>
  );
}
