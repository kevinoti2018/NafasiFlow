// NavHeader.tsx (Dashboard nav)
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Zap, Briefcase, Flame } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { getCurrentUser } from "@/lib/utils/session";
import { cn } from "@/lib/utils";

const NavHeader = async () => {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-[#161b1d]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-9 w-9 text-slate-500 transition-colors hover:bg-[#005f78]/10 hover:text-[#005f78] dark:text-slate-400 dark:hover:text-[#4db8d4]" />

        <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 lg:block" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Nafasi Flow
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-[#005f78]/10 px-2.5 py-1">
              <Zap className="h-3 w-3 fill-[#005f78] text-[#005f78] dark:fill-[#4db8d4] dark:text-[#4db8d4]" />
              <span className="text-[10px] font-semibold text-[#005f78] dark:text-[#4db8d4]">
                Optimization Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Welcome */}
      <div className="hidden md:flex items-center gap-2">
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Welcome, {firstName}
        </h1>
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#005f78]/40 opacity-75 dark:bg-[#005f78]/30" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#005f78] dark:bg-[#4db8d4]" />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 md:flex">
          <Briefcase className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Phase 1 Active
          </span>
        </div>

        <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

        <ThemeToggle />
      </div>
    </header>
  );
};

export default NavHeader;
