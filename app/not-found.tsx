import Link from "next/link";
import { MoveLeft, Terminal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button"; // Assuming you use shadcn
import { cn } from "@/lib/utils";

const Page = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-24 text-center">
      {/* --- BACKGROUND DECOR (Optional) --- */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* --- ICON --- */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
        <Terminal className="h-8 w-8 stroke-[1.5px]" />
      </div>

      {/* --- CONTENT --- */}
      <div className="space-y-4">
        <h1 className="text-8xl font-black tracking-tighter text-foreground/10 md:text-9xl">
          404
        </h1>

        <div className="-mt-12 md:-mt-16">
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-foreground">
            Navigation Lost
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[13px] font-medium leading-relaxed tracking-wide text-muted-foreground uppercase italic">
            The requested resource is outside our current build scope. The path
            might have been refactored or deleted.
          </p>
        </div>
      </div>

      {/* --- ACTION --- */}
      <div className="mt-10">
        <Link
          href="/my-account"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-14 rounded-2xl px-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95",
          )}
        >
          <MoveLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to System
        </Link>
      </div>

      {/* --- FOOTER DECOR --- */}
      <div className="absolute bottom-8 text-[10px] font-bold tracking-[0.5em] text-muted-foreground/30 uppercase">
        Career Engine // v5.3
      </div>
    </div>
  );
};

export default Page;
