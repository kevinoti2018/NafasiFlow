/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "./UserProfile";
import * as Icons from "lucide-react";
import { LucideProps, Cpu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const IconRenderer = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Activity {...props} />;
  return <IconComponent {...props} />;
};

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  image?: string | null;
  isPasswordSet?: boolean;
};

type AppSidebarProps = {
  sections: {
    label: string;
    items: { title: string; url: string; iconName: string; badge?: string }[];
  }[];
  user: User;
};

export function AppSidebar({ sections, user }: Readonly<AppSidebarProps>) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[--sidebar-width] bg-background" />;
  }

  return (
    <Sidebar className="border-r border-border bg-background transition-colors duration-300">
      {/* --- HEADER --- */}
      <SidebarHeader className="flex h-24 flex-col justify-center border-b border-border/50 px-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all group-hover:scale-110 group-hover:rotate-3">
            <Cpu className="h-6 w-6 stroke-[2.5px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg leading-none font-black tracking-tighter text-foreground uppercase">
              Nafasi
            </span>
            <span className="mt-1 text-[10px] font-black tracking-[0.3em] text-primary uppercase">
              Flow
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* --- NAVIGATION --- */}
      <SidebarContent className="gap-10 px-4 pt-8">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="mb-4 px-2 text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase italic">
              {section.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <Link
                        href={item.url}
                        className={cn(
                          "group/item flex h-12 items-center justify-between rounded-2xl border border-transparent px-4 text-sm font-bold transition-all duration-300",
                          isActive
                            ? "bg-foreground text-background shadow-lg shadow-foreground/10 dark:bg-primary dark:text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <IconRenderer
                            name={item.iconName}
                            className={cn(
                              "h-5 w-5 shrink-0 transition-transform duration-300",
                              isActive
                                ? "scale-110"
                                : "opacity-40 group-hover/item:scale-110 group-hover/item:opacity-100",
                            )}
                          />
                          <span className="text-[11px] font-black tracking-widest uppercase">
                            {item.title}
                          </span>
                        </div>

                        {item.badge && (
                          <span
                            className={cn(
                              "rounded-lg px-2 py-0.5 text-[9px] font-black tracking-widest uppercase",
                              isActive
                                ? "bg-background text-foreground dark:bg-primary-foreground dark:text-primary"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* --- FOOTER --- */}
      <SidebarFooter className="mt-auto border-t border-border bg-muted/20 p-4">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
