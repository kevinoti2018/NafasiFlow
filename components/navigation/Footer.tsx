import Link from "next/link";
import { Circle, Flame } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-background/30 py-12 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-xl font-bold tracking-tighter text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Flame className="text-primary-foreground" size={18} />
              </div>
              CONSISTENCY
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A high-performance career system designed to optimize CVs, track
              applications, and master your professional narrative.
            </p>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-widest text-foreground uppercase">
              System
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-primary"
                >
                  My Tracker
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/cv"
                  className="transition-colors hover:text-primary"
                >
                  CV Optimizer
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/templates"
                  className="transition-colors hover:text-primary"
                >
                  Templates
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-widest text-foreground uppercase">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-primary"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-primary"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 md:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Circle
              className="animate-pulse fill-emerald-500 text-emerald-500"
              size={8}
            />
            Career Engine Operational • 2026
          </div>
          <p className="text-xs text-muted-foreground">
            Built for execution. No dark patterns.
          </p>
        </div>
      </div>
    </footer>
  );
}
