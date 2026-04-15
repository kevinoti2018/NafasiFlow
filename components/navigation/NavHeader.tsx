import { SidebarTrigger } from "@/components/ui/sidebar";
import { Zap, Briefcase } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { getCurrentUser } from "@/lib/utils/session";

const NavHeader = async () => {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border/60 bg-background/90 px-8 backdrop-blur-md transition-all">
      {/* Left Section: System Context */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-10 w-10 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" />
          <div className="hidden h-8 w-[1px] bg-border lg:block" />
        </div>

        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-5">
          {/* Phase 1 Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
              Career Engine
            </span>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
              <Zap className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-[11px] font-extrabold text-primary">
                Optimization Ready
              </span>
            </div>
          </div>

          <h1 className="text-base font-black tracking-tight text-foreground lg:text-lg">
            Welcome, {firstName}
            <span className="ml-3 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          </h1>
        </div>
      </div>

      {/* Right Section: Core Tools */}
      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-2 rounded-xl bg-muted/50 px-4 py-2 md:flex">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Phase 1 Active
          </span>
        </div>

        <div className="h-8 w-[1px] bg-border" />

        <ThemeToggle />
      </div>
    </header>
  );
};

export default NavHeader;
